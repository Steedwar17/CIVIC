// F1 — Geolocalización. Requiere HTTPS (o localhost).

export class GeoError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const MESSAGES = {
  1: 'Negaste el permiso de ubicación. Actívalo en los ajustes del navegador para poder reportar.',
  2: 'No pudimos determinar tu ubicación. Revisa que el GPS esté activo e inténtalo de nuevo.',
  3: 'La ubicación tardó demasiado en responder. Inténtalo de nuevo.',
};

/** Devuelve { lat, lng, accuracy } o lanza GeoError con mensaje en español. */
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('Tu dispositivo no soporta geolocalización.', 0));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new GeoError(MESSAGES[err.code] || MESSAGES[2], err.code)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
