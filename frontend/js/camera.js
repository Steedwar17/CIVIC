// F1 — Captura con cámara + GPS + compresión en cliente.
import { getPosition } from './geo.js';

const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.8;

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* cae al método con <img> */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

/** Reduce el lado mayor a ~1024 px y exporta JPEG calidad 0.8 (7.9). */
export async function compressImage(file) {
  const bmp = await loadBitmap(file);
  const w = bmp.width;
  const h = bmp.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  if (bmp.close) bmp.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('No se pudo comprimir la imagen.');
  return blob;
}

/**
 * Abre la cámara del dispositivo. Al capturar, pide el GPS EN EL MISMO EVENTO y comprime la foto.
 * Resuelve { blob, previewUrl, position, geoError } o null si el usuario cancela.
 */
export function captureReport() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');

    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      // GPS se solicita de inmediato, en paralelo a la compresión.
      const geoPromise = getPosition().then(
        (position) => ({ position, geoError: null }),
        (geoError) => ({ position: null, geoError }),
      );
      Promise.all([compressImage(file), geoPromise])
        .then(([blob, geo]) => resolve({ blob, previewUrl: URL.createObjectURL(blob), ...geo }))
        .catch(reject);
    });
    input.click();
  });
}
