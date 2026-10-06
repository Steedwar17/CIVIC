// F1/F2 — Flujo de reporte: cámara + GPS → formulario → POST /api/reports.
import { api } from './api.js';
import { captureReport } from './camera.js';
import { getPosition } from './geo.js';

const DESC_MIN = 10;
const DESC_MAX = 500;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let busy = false; // evita abrir dos capturas a la vez

/** Punto de entrada: abre la cámara y luego el formulario. */
export async function startReportFlow() {
  if (busy || document.querySelector('.report-overlay')) return;
  busy = true;
  try {
    const capture = await captureReport();
    if (capture) openForm(capture);
  } catch {
    window.showToast?.('No pudimos procesar la foto. Inténtalo de nuevo.', 'error');
  } finally {
    busy = false;
  }
}

function openForm(capture) {
  let { position, geoError } = capture;
  let submitting = false;

  const overlay = el('div', 'report-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Nuevo reporte');

  const form = el('form', 'report-modal');
  form.noValidate = true;

  form.append(el('h2', 'report-modal-title', 'Nuevo reporte'));

  const img = el('img', 'report-preview');
  img.src = capture.previewUrl;
  img.alt = 'Vista previa de la foto del problema';
  form.append(img);

  // ── Ubicación ──
  const geoBox = el('div', 'report-geo');
  const geoText = el('span', 'report-geo-text');
  const geoRetry = el('button', 'btn-secondary report-geo-retry', 'Reintentar ubicación');
  geoRetry.type = 'button';
  geoBox.append(geoText, geoRetry);
  form.append(geoBox);

  // ── Descripción ──
  const group = el('div', 'form-group');
  const label = el('label', 'form-label', 'Descripción del problema');
  label.htmlFor = 'report-desc';
  const textarea = el('textarea', 'form-input report-desc');
  textarea.id = 'report-desc';
  textarea.rows = 4;
  textarea.maxLength = DESC_MAX;
  textarea.placeholder = 'Ej.: Hueco grande en la vía frente al parque…';
  const counter = el('small', 'report-counter');
  group.append(label, textarea, counter);
  form.append(group);

  // ── Anónimo ──
  const anonLabel = el('label', 'report-anon');
  const anon = el('input');
  anon.type = 'checkbox';
  anon.id = 'report-anon';
  anonLabel.append(anon, document.createTextNode(' Publicar de forma anónima'));
  form.append(anonLabel);

  form.append(
    el('p', 'report-privacy', 'Usamos tu ubicación solo para georreferenciar este reporte.'),
  );

  // ── Acciones ──
  const actions = el('div', 'report-actions');
  const cancel = el('button', 'btn-secondary', 'Cancelar');
  cancel.type = 'button';
  const submit = el('button', 'btn-primary', 'Enviar reporte');
  submit.type = 'submit';
  actions.append(cancel, submit);
  form.append(actions);

  overlay.append(form);
  document.body.append(overlay);
  document.body.classList.add('modal-open');
  textarea.focus();

  function descLength() {
    return textarea.value.trim().length;
  }

  function refresh() {
    if (position) {
      geoText.textContent =
        `Ubicación: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} ` +
        `(precisión ±${Math.round(position.accuracy)} m)`;
      geoBox.classList.remove('error');
      geoRetry.hidden = true;
    } else {
      geoText.textContent = geoError?.message || 'Sin ubicación. No es posible enviar el reporte.';
      geoBox.classList.add('error');
      geoRetry.hidden = false;
    }
    const n = descLength();
    counter.textContent = `${n}/${DESC_MAX} (mínimo ${DESC_MIN})`;
    submit.disabled = submitting || !position || n < DESC_MIN || n > DESC_MAX;
    submit.textContent = submitting ? 'Enviando…' : 'Enviar reporte';
  }

  function close() {
    URL.revokeObjectURL(capture.previewUrl);
    overlay.remove();
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape' && !submitting) close();
  }
  document.addEventListener('keydown', onKey);

  textarea.addEventListener('input', refresh);
  cancel.addEventListener('click', () => !submitting && close());

  geoRetry.addEventListener('click', async () => {
    geoRetry.disabled = true;
    geoText.textContent = 'Buscando tu ubicación…';
    try {
      position = await getPosition();
      geoError = null;
    } catch (err) {
      position = null;
      geoError = err;
    }
    geoRetry.disabled = false;
    refresh();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting || submit.disabled) return; // bloquea doble envío
    submitting = true;
    refresh();

    const data = new FormData();
    data.append('foto', capture.blob, 'reporte.jpg');
    data.append('descripcion', textarea.value.trim());
    data.append('lat', String(position.lat));
    data.append('lng', String(position.lng));
    data.append('accuracy', String(position.accuracy));
    data.append('publicado_anonimo', anon.checked ? 'true' : 'false');

    try {
      const result = await api.createReport(data);
      close();
      if (result.estado === 'aprobado') {
        window.showToast?.('¡Reporte publicado!', 'success');
      } else if (result.estado === 'rechazado') {
        window.showToast?.(result.motivo_rechazo || 'Tu reporte fue rechazado.', 'error', 5000);
      } else {
        window.showToast?.('Tu reporte quedó en revisión.', 'info');
      }
      document.dispatchEvent(new CustomEvent('civic:report-created', { detail: result }));
    } catch (err) {
      submitting = false;
      refresh();
      window.showToast?.(err.message, 'error', 5000);
    }
  });

  refresh();
}
