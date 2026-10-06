"""Entidades SQLAlchemy (cap. 5 de ARQUITECTURA.md)."""
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


def utcnow() -> datetime:
    """UTC 'naive' sin microsegundos (SQLite no guarda zona; el cursor del feed usa segundos)."""
    return datetime.now(timezone.utc).replace(tzinfo=None, microsecond=0)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(60))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    rol: Mapped[str] = mapped_column(String(10), default="ciudadano")
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    nivel: Mapped[str] = mapped_column(String(30), default="Vecino")
    racha: Mapped[int] = mapped_column(Integer, default=0)
    ultimo_reporte_fecha: Mapped[date | None] = mapped_column(Date, nullable=True)
    anonimo_por_defecto: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_estado_creado", "estado", "creado_en"),
        Index("ix_reports_lat_lng", "lat", "lng"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    foto_url: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str] = mapped_column(String(500))
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    subtipo: Mapped[str | None] = mapped_column(String(40), nullable=True)
    color: Mapped[str | None] = mapped_column(String(9), nullable=True)
    severidad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estado: Mapped[str] = mapped_column(String(10), default="pendiente")
    confianza_ia: Mapped[float | None] = mapped_column(Float, nullable=True)
    motivo_rechazo: Mapped[str | None] = mapped_column(String(300), nullable=True)
    hash_imagen: Mapped[str] = mapped_column(String(32), index=True)
    barrio: Mapped[str | None] = mapped_column(String(80), nullable=True)
    publicado_anonimo: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(40), unique=True)
    nombre: Mapped[str] = mapped_column(String(60))
    descripcion: Mapped[str] = mapped_column(String(200))
    icono: Mapped[str] = mapped_column(String(40))


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    badge_id: Mapped[int] = mapped_column(ForeignKey("badges.id"))
    otorgada_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("user_id", "report_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    texto: Mapped[str] = mapped_column(String(300))
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AiLog(Base):
    __tablename__ = "ai_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int | None] = mapped_column(ForeignKey("reports.id"), nullable=True)
    tipo: Mapped[str] = mapped_column(String(12))
    respuesta_json: Mapped[str] = mapped_column(Text)
    latencia_ms: Mapped[int] = mapped_column(Integer, default=0)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
