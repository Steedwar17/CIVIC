# CIVIC

Plataforma web (PWA) de reporte ciudadano gamificado. Ver [ARQUITECTURA.md](ARQUITECTURA.md).

## Estado

**Fase 1** — F1 (cámara + GPS), F2 (envío y almacenamiento), F6 (feed, likes, comentarios) y
auth mínima (F9) para que el reporte creado aparezca en el feed.

Pendiente: F3 (IA), F4 (chat), F5 (despliegue), F7 (mapas), F8 (gamificación), F10 (admin).
Mientras no exista F3, `AUTO_APPROVE_DEV=true` aprueba los reportes nuevos automáticamente.

## Estructura

```
CIVIC/
├── ARQUITECTURA.md
├── .env.example
├── backend/            # FastAPI + SQLAlchemy + SQLite
│   ├── main.py  config.py  db.py  models.py  schemas.py  deps.py  errors.py  limiter.py
│   ├── routers/        # auth, reports, feed, social
│   ├── services/       # security, storage, geo, moderation, reports, feed
│   └── tests/
└── frontend/           # PWA (HTML + JS ES modules)
    ├── index.html  manifest.json  sw.js
    ├── css/            # main.css, phase1.css
    └── js/             # api, app, auth, camera, geo, report, feed, home
```

## Ejecución local

Backend (puerto 8000):

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate    # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy ..\.env.example ..\.env                      # y define JWT_SECRET
uvicorn main:app --reload --port 8000
```

Frontend (puerto 5500, debe coincidir con `ALLOWED_ORIGINS`):

```bash
cd frontend
python -m http.server 5500
```

La cámara y el GPS requieren **HTTPS** en un celular (en `localhost` funcionan sin HTTPS).
Para apuntar a otra API: `localStorage.setItem('civic_api_base', 'https://tu-api')`.

## Pruebas

```bash
cd backend
pytest
```