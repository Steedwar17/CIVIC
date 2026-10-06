// Cliente HTTP único del frontend (fetch + token). Ningún otro módulo llama a fetch directamente.

const TOKEN_KEY = 'civic_token';
const USER_KEY = 'civic_user';

export const API_BASE = (
  window.CIVIC_API_BASE ||
  localStorage.getItem('civic_api_base') ||
  'http://localhost:8000'
).replace(/\/$/, '');

export class ApiClientError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** URL absoluta para recursos del backend (ej. /uploads/uuid.jpg). */
export function assetUrl(path) {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;
}

async function request(path, { method = 'GET', json, formData, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (formData) {
    body = formData; // el navegador fija el boundary multipart
  } else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { method, headers, body });
  } catch {
    throw new ApiClientError('No pudimos conectar con el servidor. Revisa tu conexión.', 'RED', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      clearSession();
      document.dispatchEvent(new CustomEvent('civic:unauthorized'));
    }
    throw new ApiClientError(
      (data && data.detail) || 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      (data && data.code) || 'ERROR',
      res.status,
    );
  }
  return data;
}

export const api = {
  register: (nombre, email, password) =>
    request('/auth/register', { method: 'POST', json: { nombre, email, password }, auth: false }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', json: { email, password }, auth: false }),
  me: () => request('/users/me'),
  createReport: (formData) => request('/reports', { method: 'POST', formData }),
  getFeed: ({ cursor, categoria, limit = 10 } = {}) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    if (categoria) q.set('categoria', categoria);
    return request(`/feed?${q}`);
  },
  toggleLike: (id) => request(`/reports/${id}/like`, { method: 'POST' }),
  getComments: (id) => request(`/reports/${id}/comments`),
  addComment: (id, texto) => request(`/reports/${id}/comments`, { method: 'POST', json: { texto } }),
};
