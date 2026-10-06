// Pantalla de inicio. El feed real vive en feed.js (F6); estadísticas y ranking siguen con datos
// simulados hasta que se implementen sus endpoints (F8).
import { initFeed } from './feed.js';

const SEED_STATS = { reportes: 1240, barrios: 38, resueltos: 312 };

const SEED_RANKING = [
  { nombre: 'María Pérez',   nivel: 'Líder cívico',     puntos: 1820, initials: 'MP' },
  { nombre: 'Diego Ramírez', nivel: 'Guardián urbano', puntos: 850,  initials: 'DR' },
  { nombre: 'Camila Torres', nivel: 'Vigía cívico',    puntos: 410,  initials: 'CT' },
  { nombre: 'Luis Gómez',    nivel: 'Observador',       puntos: 165,  initials: 'LG' },
];

function animateCounter(el, target, duration = 1000) {
  if (!el) return;
  let start = 0;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target).toLocaleString('es-CO');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderStats() {
  const el = document.getElementById('home-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value" id="stat-reports">0</span>
        <span class="stat-label">Reportes registrados</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value" id="stat-barrios">0</span>
        <span class="stat-label">Sectores activos</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value" id="stat-resolved">0</span>
        <span class="stat-label">Casos gestionados</span>
      </div>
    </div>
  `;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(document.getElementById('stat-reports'),  SEED_STATS.reportes);
        animateCounter(document.getElementById('stat-barrios'),  SEED_STATS.barrios, 700);
        animateCounter(document.getElementById('stat-resolved'), SEED_STATS.resueltos, 900);
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });
  observer.observe(el);
}

function renderRanking() {
  const el = document.getElementById('home-ranking');
  if (!el) return;
  const sorted = [...SEED_RANKING].sort((a, b) => b.puntos - a.puntos);
  el.innerHTML = `
    <div class="leaderboard-preview">
      ${sorted.slice(0, 3).map((u, i) => `
        <div class="leaderboard-row">
          <div class="rank-badge rank-${i + 1}">${i + 1}</div>
          <div class="leaderboard-avatar" aria-hidden="true">${u.initials}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${u.nombre}</div>
            <div class="leaderboard-level">${u.nivel}</div>
          </div>
          <span class="leaderboard-pts">${u.puntos.toLocaleString('es-CO')} pts</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFeatures() {
  const el = document.getElementById('home-features');
  if (!el) return;
  const items = [
    {
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
      title: 'Captura georreferenciada',
      desc: 'Fotografía el problema urbano en el lugar de los hechos con detección precisa de ubicación.'
    },
    {
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
      title: 'Validación técnica',
      desc: 'Procesamiento automatizado para verificación de autenticidad y clasificación en su categoría correspondiente.'
    },
    {
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
      title: 'Mapa e impacto urbano',
      desc: 'El reporte verificado se integra al feed público y al mapa comunitario para trazabilidad ciudadana.'
    },
    {
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
      title: 'Reconocimiento cívico',
      desc: 'Acumula puntuación de participación ciudadana y contribuye al seguimiento de soluciones en tu sector.'
    },
  ];

  el.innerHTML = `
    <div class="features-grid">
      ${items.map(f => `
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">${f.svg}</div>
          <div class="feature-text">
            <h3>${f.title}</h3>
            <p>${f.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function initHome() {
  renderStats();
  initFeed();
  renderRanking();
  renderFeatures();
}
