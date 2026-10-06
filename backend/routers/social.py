"""Likes y comentarios (F6)."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from errors import ApiError
from models import Comment, Like, User
from schemas import CommentIn, CommentOut, LikeOut
from services import feed as feed_service
from services import reports as report_service
from services.security import sanitize_text

router = APIRouter(tags=["social"])


def _like_count(db: Session, report_id: int) -> int:
    return db.scalar(select(func.count(Like.id)).where(Like.report_id == report_id)) or 0


@router.post("/reports/{report_id}/like", response_model=LikeOut)
def toggle_like(
    report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    report_service.get_visible_report(db, report_id, user)
    existing = db.scalar(
        select(Like).where(Like.report_id == report_id, Like.user_id == user.id)
    )
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(Like(report_id=report_id, user_id=user.id))
        liked = True
    try:
        db.commit()
    except IntegrityError:  # doble clic simultáneo: el like ya existe
        db.rollback()
        liked = True
    return LikeOut(liked=liked, likes=_like_count(db, report_id))


@router.get("/reports/{report_id}/comments", response_model=list[CommentOut])
def list_comments(
    report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    report_service.get_visible_report(db, report_id, user)
    rows = db.execute(
        select(Comment, User)
        .join(User, User.id == Comment.user_id)
        .where(Comment.report_id == report_id)
        .order_by(Comment.creado_en.asc(), Comment.id.asc())
    ).all()
    return [
        CommentOut(
            id=c.id,
            autor=feed_service.autor_out(u, False),
            texto=c.texto,
            creado_en=feed_service.iso(c.creado_en),
        )
        for c, u in rows
    ]


@router.post("/reports/{report_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    report_id: int,
    body: CommentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_service.get_visible_report(db, report_id, user)
    texto = sanitize_text(body.texto)
    if not texto:
        raise ApiError(422, "COMENTARIO_VACIO", "Escribe un comentario antes de enviarlo.")
    comment = Comment(report_id=report_id, user_id=user.id, texto=texto)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentOut(
        id=comment.id,
        autor=feed_service.autor_out(user, False),
        texto=comment.texto,
        creado_en=feed_service.iso(comment.creado_en),
    )
