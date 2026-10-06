import { initHome } from './home.js';
import { initAuth } from './auth.js';
import { startReportFlow } from './report.js';

const SESSION = {
  token: localStorage.getItem('civic_token') || null,
  user: JSON.parse(localStorage.getItem('civic_user') || 'null'),
  isLogged: () => !!SESSION.token,
};
window.CIVIC_SESSION = SESSION;

const screens = ['home', 'map', 'feed', 'ranking', 'chat', 'auth'];

export function showScreen(id) {
  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle('active', s === id);
  });

  document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === id);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.showScreen = showScreen;

const TOAST_ICONS = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2EA043" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
  const iconSlot = document.createElement('span');
  iconSlot.className = 'toast-icon';
  iconSlot.setAttribute('aria-hidden', 'true');
  iconSlot.innerHTML = icon; // SVG estático
  const msgSlot = document.createElement('span');
  msgSlot.className = 'toast-msg';
  msgSlot.textContent = msg; // nunca innerHTML con texto dinámico
  toast.append(iconSlot, msgSlot);
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen(btn.dataset.screen);
    });
  });

  document.getElementById('logo-home')?.addEventListener('click', () => {
    showScreen('home');
  });

  const triggerReport = () => {
    if (!SESSION.isLogged()) {
      showScreen('auth');
      showToast('Inicia sesión para registrar un reporte', 'info');
      return;
    }
    startReportFlow();
  };

  document.getElementById('btn-report')?.addEventListener('click', triggerReport);
  document.getElementById('btn-header-report')?.addEventListener('click', triggerReport);

  initHome();
  initAuth();

  showScreen('home');
});
