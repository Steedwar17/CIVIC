"""Reglas de decisión del reporte. En F1 solo contiene la fuente única de categorías/colores (7.3).

F3 ampliará este módulo con la decisión basada en IA (7.2).
"""

CATEGORY_COLORS: dict[str, str] = {
    "Infraestructura": "#F59E0B",
    "Alumbrado": "#FACC15",
    "Aseo": "#10B981",
    "Seguridad": "#EF4444",
    "Otros": "#6366F1",
}
DEFAULT_CATEGORY = "Otros"


def color_for(categoria: str | None) -> str:
    """El backend asigna el color; categorías desconocidas caen en 'Otros'."""
    if categoria not in CATEGORY_COLORS:
        categoria = DEFAULT_CATEGORY
    return CATEGORY_COLORS[categoria]
