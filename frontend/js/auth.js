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

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) {
      window.showToast('Completa todos los campos requeridos', 'error');
      return;
    }

    const fakeUser = { nombre: 'Usuario Demo', nivel: 'Ciudadano activo', puntos: 0 };
    localStorage.setItem('civic_token', 'demo_token');
    localStorage.setItem('civic_user', JSON.stringify(fakeUser));
    window.CIVIC_SESSION.token = 'demo_token';
    window.CIVIC_SESSION.user  = fakeUser;
    window.showToast('Sesión iniciada correctamente', 'success');

    if (window.showScreen) {
      window.showScreen('home');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    window.showToast('El registro de nuevos usuarios estará habilitado próximamente', 'info');
  });

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
    window.CIVIC_SESSION.token = null;
    window.CIVIC_SESSION.user  = null;
    window.showToast('Sesión cerrada correctamente', 'info');
    if (window.showScreen) {
      window.showScreen('home');
    }
  });
}
