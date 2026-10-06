"""Guardado y validación de imágenes (7.1). Disco local en desarrollo."""
import io
import uuid

import imagehash
from PIL import Image, UnidentifiedImageError

from config import settings
from errors import ApiError

MAX_BYTES = 5 * 1024 * 1024
_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}


def read_and_validate(data: bytes) -> tuple[Image.Image, str]:
    """Valida tamaño y formato REAL (no se confía en content-type). Devuelve (imagen, extensión)."""
    if not data:
        raise ApiError(400, "FOTO_REQUERIDA", "Debes adjuntar una foto del problema.")
    if len(data) > MAX_BYTES:
        raise ApiError(413, "FOTO_MUY_GRANDE", "La foto supera los 5 MB. Intenta con una más liviana.")
    try:
        img = Image.open(io.BytesIO(data))
        fmt = img.format
        img.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise ApiError(400, "FOTO_INVALIDA", "El archivo no es una imagen válida (JPEG, PNG o WebP).")
    if fmt not in _FORMATS:
        raise ApiError(400, "FOTO_INVALIDA", "Formato no permitido. Usa JPEG, PNG o WebP.")
    return img, _FORMATS[fmt]


def perceptual_hash(img: Image.Image) -> str:
    return str(imagehash.phash(img))


def hamming(hash_a: str, hash_b: str) -> int:
    try:
        return imagehash.hex_to_hash(hash_a) - imagehash.hex_to_hash(hash_b)
    except (ValueError, TypeError):
        return 64


def save_image(data: bytes, ext: str) -> str:
    """Guarda con nombre UUID y devuelve la ruta pública (/uploads/<uuid>.<ext>)."""
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{ext}"
    (settings.UPLOAD_DIR / name).write_bytes(data)
    return f"/uploads/{name}"
