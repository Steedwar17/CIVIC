"""Validaciones y utilidades geográficas (7.1). La geocodificación inversa llega en F7."""
import math

# Bounding box de Colombia (7.1)
COL_LAT_MIN, COL_LAT_MAX = -4.3, 13.5
COL_LNG_MIN, COL_LNG_MAX = -79.1, -66.8


def coords_valid(lat: float, lng: float) -> bool:
    """Rango global válido y dentro de Colombia."""
    if not (math.isfinite(lat) and math.isfinite(lng)):
        return False
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return False
    return COL_LAT_MIN <= lat <= COL_LAT_MAX and COL_LNG_MIN <= lng <= COL_LNG_MAX


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distancia en metros entre dos coordenadas."""
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
