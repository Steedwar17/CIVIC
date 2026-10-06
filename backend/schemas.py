"""Contratos Pydantic (cap. 6)."""
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def _bcrypt_limit(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("La contraseña es demasiado larga")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class BadgeOut(BaseModel):
    codigo: str
    nombre: str
    descripcion: str
    icono: str


class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    puntos: int
    nivel: str
    racha: int
    medallas: list[BadgeOut] = []


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AutorOut(BaseModel):
    nombre: str
    nivel: str
    anonimo: bool


class FeedItem(BaseModel):
    id: int
    autor: AutorOut
    foto_url: str
    descripcion: str
    categoria: str | None
    color: str | None
    severidad: int | None
    lat: float
    lng: float
    barrio: str | None
    likes: int
    comentarios: int
    liked_por_mi: bool
    creado_en: str


class FeedPage(BaseModel):
    items: list[FeedItem]
    next_cursor: str | None


class ReportDetail(FeedItem):
    estado: str
    motivo_rechazo: str | None
    accuracy: float | None


class ReportCreateOut(BaseModel):
    id: int
    estado: str
    motivo_rechazo: str | None
    puntos_ganados: int
    medallas_nuevas: list[str]
    nivel: str


class LikeOut(BaseModel):
    liked: bool
    likes: int


class CommentIn(BaseModel):
    texto: str = Field(min_length=1, max_length=300)


class CommentOut(BaseModel):
    id: int
    autor: AutorOut
    texto: str
    creado_en: str
