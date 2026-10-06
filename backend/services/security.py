"""Utilidades de seguridad: bcrypt, JWT y sanitización de texto (7.8)."""
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from config import settings

_TAGS = re.compile(r"<[^>]*>")
_CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
_SPACES = re.compile(r"[ \t]+")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> int | None:
    """Devuelve el id de usuario o None si el token es inválido/expirado."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None


def sanitize_text(text: str) -> str:
    """Texto plano: sin etiquetas HTML, sin caracteres de control, espacios normalizados."""
    text = _TAGS.sub("", text)
    text = _CONTROL.sub("", text)
    text = _SPACES.sub(" ", text)
    return text.strip()
