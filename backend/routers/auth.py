"""Registro, login y perfil (F9 mínimo para habilitar la Fase 1)."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from errors import ApiError
from limiter import limiter
from models import Badge, User, UserBadge
from schemas import BadgeOut, LoginIn, RegisterIn, TokenOut, UserOut
from services.security import create_token, hash_password, sanitize_text, verify_password

router = APIRouter(tags=["auth"])


def user_out(db: Session, user: User) -> UserOut:
    badges = db.scalars(
        select(Badge).join(UserBadge, UserBadge.badge_id == Badge.id).where(UserBadge.user_id == user.id)
    ).all()
    return UserOut(
        id=user.id, nombre=user.nombre, email=user.email, rol=user.rol,
        puntos=user.puntos, nivel=user.nivel, racha=user.racha,
        medallas=[
            BadgeOut(codigo=b.codigo, nombre=b.nombre, descripcion=b.descripcion, icono=b.icono)
            for b in badges
        ],
    )


@router.post("/auth/register", response_model=TokenOut, status_code=201)
@limiter.limit("10/minute")
def register(request: Request, body: RegisterIn, db: Session = Depends(get_db)):
    nombre = sanitize_text(body.nombre)
    if len(nombre) < 2:
        raise ApiError(422, "NOMBRE_INVALIDO", "Escribe un nombre válido.")
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise ApiError(409, "EMAIL_EXISTE", "Ya existe una cuenta con ese correo.")
    user = User(nombre=nombre, email=email, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ApiError(409, "EMAIL_EXISTE", "Ya existe una cuenta con ese correo.")
    return TokenOut(access_token=create_token(user.id), user=user_out(db, user))


@router.post("/auth/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise ApiError(401, "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos.")
    return TokenOut(access_token=create_token(user.id), user=user_out(db, user))


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return user_out(db, user)
