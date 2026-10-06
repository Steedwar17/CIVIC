"""Punto de entrada: app, CORS, rate limiter, manejo de errores y routers."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

import models  # noqa: F401  (registra las tablas en Base.metadata)
from config import settings
from db import Base, engine
from errors import ApiError
from limiter import limiter
from routers import auth, feed, reports, social

Base.metadata.create_all(bind=engine)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="CIVIC API", version="0.1.0")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def _error(status: int, code: str, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": detail, "code": code})


@app.exception_handler(ApiError)
async def api_error_handler(_: Request, exc: ApiError):
    return _error(exc.status_code, exc.code, exc.detail)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, __: RateLimitExceeded):
    return _error(429, "DEMASIADAS_SOLICITUDES", "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.")


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, __: RequestValidationError):
    return _error(422, "DATOS_INVALIDOS", "Los datos enviados no son válidos. Revisa el formulario.")


@app.exception_handler(StarletteHTTPException)
async def http_handler(_: Request, exc: StarletteHTTPException):
    msgs = {404: "No encontramos lo que buscas.", 405: "Método no permitido."}
    return _error(exc.status_code, f"HTTP_{exc.status_code}", msgs.get(exc.status_code, "Ocurrió un error."))


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


for _router in (auth.router, reports.router, feed.router, social.router):
    app.include_router(_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
