"""Configuración leída desde variables de entorno (ver .env.example)."""
import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

_BASE_DIR = Path(__file__).resolve().parent
load_dotenv(_BASE_DIR.parent / ".env")
load_dotenv(_BASE_DIR / ".env")

logger = logging.getLogger("civic")


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "si")


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civic.db")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    JWT_ALGORITHM: str = "HS256"
    ALLOWED_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5500").split(",")
        if o.strip()
    ]
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(_BASE_DIR / "uploads")))
    RATE_LIMIT_ENABLED: bool = _bool("RATE_LIMIT_ENABLED", True)
    # Mientras no exista F3 (IA), los reportes nuevos se aprueban automáticamente
    # para poder verlos en el feed. Poner en false cuando se implemente F3.
    AUTO_APPROVE_DEV: bool = _bool("AUTO_APPROVE_DEV", True)

    def __init__(self) -> None:
        secret = os.getenv("JWT_SECRET", "").strip()
        if not secret:
            logger.warning(
                "JWT_SECRET vacío: se usa un secreto aleatorio temporal "
                "(los tokens se invalidan al reiniciar). Defínelo en .env."
            )
            secret = secrets.token_urlsafe(48)
        self.JWT_SECRET = secret


settings = Settings()
