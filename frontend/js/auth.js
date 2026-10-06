// F9 (mínimo para Fase 1) — Registro, login y cierre de sesión contra la API real.
import { api, saveSession, clearSession } from './api.js';

function startSession(data) {
  saveSession(data.access_token, data.user);
  window.CIVIC_SESSION.token = data.access_token;
  window.CIVIC_SESSION.user = data.user;
  document.dispatchEvent(new CustomEvent('civic:login'));
}

export function endSession() {
  clearSession();
  window.CIVIC_SESSION.token = null;
  window.CIVIC_SESSION.user = null;
  document.dispatchEvent(new CustomEvent('civic:logout'));
}

async function withBusy(form, task) {
  const btn = form.querySelector('button[type="submit"]');
  const label = btn?.textContent;
  if (btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Procesando…';
  }
  try {
    await task();
  } catch (err) {
    window.showToast(err.message, 'error', 4500);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = label;
    }
  }
}

export function initAuth() {
  const loginForm    = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const showRegister = document.getElementById('link-show-register');
  const showLogin    = document.getElementById('link-show-login');
  const logoutBtn    = document.getElementById('btn-logout');

  showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm?.classList.add('hidden');
    registerForm?.classList.remove('hidden');
  });

  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm?.classList.add('hidden');
    loginForm?.classList.remove('hidden');
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) {
      window.showToast('Completa todos los campos requeridos', 'error');
      return;
    }
    withBusy(loginForm, async () => {
      startSession(await api.login(email, password));
      loginForm.reset();
      window.showToast('Sesión iniciada correctamente', 'success');
      window.showScreen?.('home');
    });
  });

  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-name')?.value.trim();
    const email    = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    if (!nombre || !email || !password) {
      window.showToast('Completa todos los campos requeridos', 'error');
      return;
    }
    if (password.length < 8) {
      window.showToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }
    withBusy(registerForm, async () => {
      startSession(await api.register(nombre, email, password));
      registerForm.reset();
      window.showToast('Cuenta creada. ¡Bienvenido a CIVIC!', 'success');
      window.showScreen?.('home');
    });
  });

  logoutBtn?.addEventListener('click', () => {
    endSession();
    window.showToast('Sesión cerrada correctamente', 'info');
    window.showScreen?.('home');
  });

  // Token expirado o inválido: api.js ya limpió el almacenamiento.
  document.addEventListener('civic:unauthorized', () => {
    window.CIVIC_SESSION.token = null;
    window.CIVIC_SESSION.user = null;
    document.dispatchEvent(new CustomEvent('civic:logout'));
    window.showToast('Tu sesión expiró. Inicia sesión de nuevo.', 'info');
    window.showScreen?.('auth');
  });
}
