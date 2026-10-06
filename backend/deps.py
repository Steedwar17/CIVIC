"""Dependencias de FastAPI: sesión de BD y usuario autenticado."""
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from db import SessionLocal
from errors import ApiError
from models import User
from services.security import decode_token

_bearer = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise ApiError(401, "NO_AUTENTICADO", "Inicia sesión para continuar.")
    user_id = decode_token(creds.credentials)
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise ApiError(401, "TOKEN_INVALIDO", "Tu sesión expiró. Inicia sesión de nuevo.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.rol != "admin":
        raise ApiError(403, "PROHIBIDO", "No tienes permisos para esta acción.")
    return user
