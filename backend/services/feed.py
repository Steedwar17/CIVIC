"""Construcción del feed y serialización de tarjetas (F6, 7.5)."""
from datetime import datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from errors import ApiError
from models import Comment, Like, Report, User
from schemas import AutorOut, FeedItem
from services.moderation import CATEGORY_COLORS

DEFAULT_LIMIT, MAX_LIMIT = 10, 30
ANON_NAME = "Anónimo"


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def encode_cursor(report: Report) -> str:
    return f"{iso(report.creado_en)}_{report.id}"


def decode_cursor(cursor: str) -> tuple[datetime, int]:
    try:
        ts, rid = cursor.rsplit("_", 1)
        return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ"), int(rid)
    except (ValueError, AttributeError):
        raise ApiError(400, "CURSOR_INVALIDO", "El cursor de paginación no es válido.")


def autor_out(user: User | None, anonimo: bool) -> AutorOut:
    if user is None:
        return AutorOut(nombre=ANON_NAME, nivel="Vecino", anonimo=True)
    return AutorOut(
        nombre=ANON_NAME if anonimo else user.nombre, nivel=user.nivel, anonimo=anonimo
    )


def build_items(db: Session, reports: list[Report], viewer_id: int) -> list[FeedItem]:
    """Serializa reportes agregando autor, contadores y estado de like (3 consultas por página)."""
    if not reports:
        return []
    ids = [r.id for r in reports]
    users = {
        u.id: u
        for u in db.scalars(select(User).where(User.id.in_({r.user_id for r in reports})))
    }
    likes = dict(
        db.execute(
            select(Like.report_id, func.count()).where(Like.report_id.in_(ids)).group_by(Like.report_id)
        ).all()
    )
    comments = dict(
        db.execute(
            select(Comment.report_id, func.count())
            .where(Comment.report_id.in_(ids))
            .group_by(Comment.report_id)
        ).all()
    )
    mine = set(
        db.scalars(select(Like.report_id).where(Like.report_id.in_(ids), Like.user_id == viewer_id))
    )
    return [
        FeedItem(
            id=r.id,
            autor=autor_out(users.get(r.user_id), r.publicado_anonimo),
            foto_url=r.foto_url,
            descripcion=r.descripcion,
            categoria=r.categoria,
            color=r.color,
            severidad=r.severidad,
            lat=r.lat,
            lng=r.lng,
            barrio=r.barrio,
            likes=likes.get(r.id, 0),
            comentarios=comments.get(r.id, 0),
            liked_por_mi=r.id in mine,
            creado_en=iso(r.creado_en),
        )
        for r in reports
    ]


def get_feed(
    db: Session, viewer: User, cursor: str | None, categoria: str | None, limit: int
) -> tuple[list[FeedItem], str | None]:
    """Solo aprobados, por creado_en desc, paginación por cursor (nunca OFFSET)."""
    if categoria is not None and categoria not in CATEGORY_COLORS:
        raise ApiError(400, "CATEGORIA_INVALIDA", "La categoría indicada no existe.")
    limit = max(1, min(limit, MAX_LIMIT))

    stmt = select(Report).where(Report.estado == "aprobado")
    if categoria:
        stmt = stmt.where(Report.categoria == categoria)
    if cursor:
        ts, rid = decode_cursor(cursor)
        stmt = stmt.where(
            or_(Report.creado_en < ts, and_(Report.creado_en == ts, Report.id < rid))
        )
    rows = list(
        db.scalars(stmt.order_by(Report.creado_en.desc(), Report.id.desc()).limit(limit + 1))
    )
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor(rows[-1]) if has_more and rows else None
    return build_items(db, rows, viewer.id), next_cursor
