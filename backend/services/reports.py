"""Lógica de negocio de reportes (F2): validación 7.1, límites, duplicados y creación."""
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from config import settings
from errors import ApiError
from models import Report, User, utcnow
from services import geo, storage
from services.moderation import DEFAULT_CATEGORY, color_for
from services.security import sanitize_text

DESC_MIN, DESC_MAX = 10, 500
MAX_PER_HOUR, MAX_PER_DAY = 5, 20
DUP_HAMMING_MAX = 5
DUP_RADIUS_M = 100
DUP_WINDOW_H = 72


def validate_description(raw: str) -> str:
    desc = sanitize_text(raw or "")
    if len(desc) < DESC_MIN or len(desc) > DESC_MAX:
        raise ApiError(
            422, "DESCRIPCION_INVALIDA",
            f"La descripción debe tener entre {DESC_MIN} y {DESC_MAX} caracteres.",
        )
    return desc


def validate_location(lat: float, lng: float) -> None:
    if not geo.coords_valid(lat, lng):
        raise ApiError(
            422, "UBICACION_INVALIDA",
            "La ubicación no es válida o está fuera de Colombia. Activa el GPS e inténtalo de nuevo.",
        )


def check_rate_limits(db: Session, user_id: int) -> None:
    """Verificación en BD: 5 por hora y 20 por día (7.1)."""
    now = utcnow()

    def count_since(delta: timedelta) -> int:
        return db.scalar(
            select(func.count(Report.id)).where(
                Report.user_id == user_id, Report.creado_en >= now - delta
            )
        ) or 0

    if count_since(timedelta(hours=1)) >= MAX_PER_HOUR:
        raise ApiError(429, "LIMITE_HORA", "Alcanzaste el máximo de 5 reportes por hora. Intenta más tarde.")
    if count_since(timedelta(days=1)) >= MAX_PER_DAY:
        raise ApiError(429, "LIMITE_DIA", "Alcanzaste el máximo de 20 reportes por día. Vuelve mañana.")


def is_duplicate(db: Session, user_id: int, img_hash: str, lat: float, lng: float) -> bool:
    """Hash perceptual (Hamming ≤ 5) del mismo usuario, o de otro a menos de 100 m, en 72 h."""
    since = utcnow() - timedelta(hours=DUP_WINDOW_H)
    rows = db.scalars(
        select(Report).where(Report.creado_en >= since, Report.estado != "rechazado")
    ).all()
    for r in rows:
        if storage.hamming(img_hash, r.hash_imagen) > DUP_HAMMING_MAX:
            continue
        if r.user_id == user_id:
            return True
        if geo.haversine_m(lat, lng, r.lat, r.lng) <= DUP_RADIUS_M:
            return True
    return False


def create_report(
    db: Session,
    user: User,
    foto_bytes: bytes,
    descripcion: str,
    lat: float,
    lng: float,
    accuracy: float | None,
    anonimo: bool | None,
) -> Report:
    desc = validate_description(descripcion)
    validate_location(lat, lng)
    check_rate_limits(db, user.id)
    img, ext = storage.read_and_validate(foto_bytes)
    img_hash = storage.perceptual_hash(img)
    foto_url = storage.save_image(foto_bytes, ext)

    report = Report(
        user_id=user.id,
        foto_url=foto_url,
        descripcion=desc,
        lat=lat,
        lng=lng,
        accuracy=accuracy,
        hash_imagen=img_hash,
        estado="pendiente",
        publicado_anonimo=user.anonimo_por_defecto if anonimo is None else anonimo,
    )

    if is_duplicate(db, user.id, img_hash, lat, lng):
        report.estado = "rechazado"
        report.motivo_rechazo = "Reporte duplicado"
    elif settings.AUTO_APPROVE_DEV:
        # Stub temporal hasta F3: aprueba para que el reporte llegue al feed (Fin de Fase 1).
        report.estado = "aprobado"
        report.categoria = DEFAULT_CATEGORY
        report.color = color_for(DEFAULT_CATEGORY)

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_visible_report(db: Session, report_id: int, user: User) -> Report:
    """Dueño y admin ven cualquier estado; los demás solo aprobados (7.5)."""
    report = db.get(Report, report_id)
    if report is None or (
        report.estado != "aprobado" and report.user_id != user.id and user.rol != "admin"
    ):
        raise ApiError(404, "REPORTE_NO_ENCONTRADO", "No encontramos ese reporte.")
    return report
