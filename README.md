# CIVIC

Plataforma web de reporte ciudadano para registrar y visualizar incidencias urbanas.

Inicio de la interfaz de usuario (frontend).

## Estructura

```
CIVIC/
├── README.md
├── .env.example
├── .gitignore
└── frontend/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── css/
    │   └── main.css
    └── js/
        ├── app.js
        ├── home.js
        └── auth.js
```

## Ejecucion local

Iniciar un servidor HTTP dentro del directorio `frontend`:

```bash
cd frontend
python3 -m http.server
```