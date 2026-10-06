"""POST /reports y GET /reports/{id} (F2)."""
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from errors import ApiError
from limiter import limiter
from models import User
from schemas import ReportCreateOut, ReportDetail
from services import feed as feed_service
from services import reports as report_service
from services.storage import MAX_BYTES

router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=ReportCreateOut, status_code=201)
@limiter.limit("30/minute")
async def create_report(
    request: Request,
    foto: UploadFile = File(...),
    descripcion: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    accuracy: float | None = Form(None),
    publicado_anonimo: bool | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await foto.read(MAX_BYTES + 1)
    report = report_service.create_report(
        db, user, data, descripcion, lat, lng, accuracy, publicado_anonimo
    )
    return ReportCreateOut(
        id=report.id,
        estado=report.estado,
        motivo_rechazo=report.motivo_rechazo,
        puntos_ganados=0,  # La gamificación llega en F8
        medallas_nuevas=[],
        nivel=user.nivel,
    )


@router.get("/reports/{report_id}", response_model=ReportDetail)
def get_report(
    report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    report = report_service.get_visible_report(db, report_id, user)
    item = feed_service.build_items(db, [report], user.id)[0]
    return ReportDetail(
        **item.model_dump(),
        estado=report.estado,
        motivo_rechazo=report.motivo_rechazo,
        accuracy=report.accuracy,
    )
