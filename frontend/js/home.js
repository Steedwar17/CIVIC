const SEED_STATS = { reportes: 1240, barrios: 38, resueltos: 312 };

const SEED_REPORTS = [
  {
    id: 1,
    autor: { nombre: 'Camila Torres', nivel: 'Vigía cívico', anonimo: false },
    tipo_icon: 'infra',
    descripcion: 'Bache de profundidad crítica sobre la calzada norte afectando la fluidez vehicular y seguridad.',
    categoria: 'Infraestructura',
    color: '#D97706',
    severidad: 4,
    lat: 5.5353,
    lng: -73.3678,
    barrio: 'San Antonio',
    apoyos: 34,
    apoyado_por_mi: false,
    creado_en: '2026-09-29T12:00:00Z',
  },
  {
    id: 2,
    autor: { nombre: 'Anónimo', nivel: 'Observador', anonimo: true },
    tipo_icon: 'alumbr',
    descripcion: 'Punto de alumbrado público inoperativo en el sendero peatonal del parque principal.',
    categoria: 'Alumbrado',
    color: '#CA8A04',
    severidad: 3,
    lat: 5.5420,
    lng: -73.3600,
    barrio: 'Centro',
    apoyos: 18,
    apoyado_por_mi: true,
    creado_en: '2026-09-29T09:30:00Z',
  },
  {
    id: 3,
    autor: { nombre: 'Diego Ramírez', nivel: 'Guardián urbano', anonimo: false },
    tipo_icon: 'aseo',
    descripcion: 'Acumulación de residuos sólidos en esquina comercial sin recolección oportuna.',
    categoria: 'Aseo',
    color: '#238636',
    severidad: 2,
    lat: 5.5380,
    lng: -73.3720,
    barrio: 'El Progreso',
    apoyos: 11,
    apoyado_por_mi: false,
    creado_en: '2026-09-28T18:45:00Z',
  },
];

const SEED_RANKING = [
  { nombre: 'María Pérez',   nivel: 'Líder cívico',     puntos: 1820, initials: 'MP' },
  { nombre: 'Diego Ramírez', nivel: 'Guardián urbano', puntos: 850,  initials: 'DR' },
  { nombre: 'Camila Torres', nivel: 'Vigía cívico',    puntos: 410,  initials: 'CT' },
  { nombre: 'Luis Gómez',    nivel: 'Observador',       puntos: 165,  initials: 'LG' },
];

const SVG_ICONS = {
  infra: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L19 4"/><path d="M9 19l4-4"/><path d="M15 19l4-4"/><path d="M4 14l5-5"/><circle cx="12" cy="12" r="3"/></svg>`,
  alumbr: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><circle cx="12" cy="14" r="5"/><path d="M9 19h6"/><path d="M10 22h4"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="19.07" y1="4.93" x2="16.24" y2="7.76"/></svg>`,
  aseo: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  pin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  coords: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>`,
  arrowUp: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>`,
  share: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

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

function renderCategoryPills() {
  const CATS = [
    { label: 'Todos',           color: '#238636' },
    { label: 'Infraestructura', color: '#D97706' },
    { label: 'Alumbrado',       color: '#CA8A04' },
    { label: 'Aseo',            color: '#238636' },
    { label: 'Seguridad',       color: '#DC2626' },
    { label: 'Otros',           color: '#4F46E5' },
  ];
  const el = document.getElementById('home-pills');
  if (!el) return;

  let active = 'Todos';
  function render() {
    el.innerHTML = `
      <div class="category-pills">
        ${CATS.map(cat => `
          <button
            class="pill ${active === cat.label ? 'active' : ''}"
            data-cat="${cat.label}"
            type="button"
            aria-pressed="${active === cat.label}"
          >
            <span class="pill-dot" style="background:${cat.color}"></span>
            ${cat.label}
          </button>
        `).join('')}
      </div>
    `;
    el.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        active = btn.dataset.cat;
        render();
        renderFeed(active);
      });
    });
  }
  render();
}

function buildCardHTML(report) {
  const initials = report.autor.anonimo
    ? '—'
    : report.autor.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const iconSvg = SVG_ICONS[report.tipo_icon] || SVG_ICONS.infra;

  return `
    <article class="report-card" id="card-${report.id}" aria-label="Reporte en ${report.barrio}">
      <div class="card-img-wrap">
        <div class="card-illustration-box">
          <div class="card-vector-icon" style="color: ${report.color};">
            ${iconSvg}
          </div>
        </div>
        <span class="card-cat-badge">
          <span class="card-cat-dot" style="background:${report.color}"></span>
          ${report.categoria}
        </span>
        <span class="card-sev-badge">Severidad ${report.severidad}/5</span>
      </div>
      <div class="card-body">
        <div class="card-author">
          <div class="card-author-info">
            <div class="author-avatar" aria-hidden="true">${initials}</div>
            <div>
              <div class="author-name">${report.autor.anonimo ? 'Ciudadano anónimo' : report.autor.nombre}</div>
              <div class="author-level">${report.autor.nivel}</div>
            </div>
          </div>
          <span class="card-time">${timeAgo(report.creado_en)}</span>
        </div>
        <p class="card-desc">${report.descripcion}</p>
        <div class="card-meta-row">
          <div class="card-location">
            <span class="meta-icon" aria-hidden="true">${SVG_ICONS.pin}</span>
            <span>${report.barrio}</span>
          </div>
          <div class="card-minimap" aria-label="Coordenadas georreferenciadas">
            <span class="meta-icon" aria-hidden="true">${SVG_ICONS.coords}</span>
            <span>${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</span>
          </div>
        </div>
        <div class="card-actions">
          <button
            class="card-action-btn upvote-btn ${report.apoyado_por_mi ? 'active' : ''}"
            id="upvote-${report.id}"
            type="button"
            aria-label="${report.apoyado_por_mi ? 'Quitar voto' : 'Apoyar reporte'}"
            data-id="${report.id}"
          >
            <span class="icon-slot">${SVG_ICONS.arrowUp}</span>
            <span class="upvote-count" id="upvotes-count-${report.id}">${report.apoyos}</span>
          </button>
          <button
            class="card-action-btn share-btn"
            id="share-${report.id}"
            type="button"
            aria-label="Compartir reporte"
            data-id="${report.id}"
          >
            <span class="icon-slot">${SVG_ICONS.share}</span>
            <span>Compartir</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderFeed(filter = 'Todos') {
  const el = document.getElementById('home-feed');
  if (!el) return;
  const items = filter === 'Todos'
    ? SEED_REPORTS
    : SEED_REPORTS.filter(r => r.categoria === filter);

  if (items.length === 0) {
    el.innerHTML = `
      <div class="state-box">
        <p class="state-title">No hay incidencias en esta categoría</p>
        <p class="state-msg">Puedes registrar un reporte en el sector seleccionado.</p>
      </div>
    `;
    return;
  }
  el.innerHTML = `<div class="cards-list">${items.map(buildCardHTML).join('')}</div>`;

  el.querySelectorAll('.upvote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const report = SEED_REPORTS.find(r => r.id === id);
      if (!report) return;

      report.apoyado_por_mi = !report.apoyado_por_mi;
      report.apoyos += report.apoyado_por_mi ? 1 : -1;
      btn.classList.toggle('active', report.apoyado_por_mi);
      btn.setAttribute('aria-label', `${report.apoyado_por_mi ? 'Quitar voto' : 'Apoyar reporte'}`);
      const countEl = document.getElementById(`upvotes-count-${id}`);
      if (countEl) countEl.textContent = report.apoyos;
    });
  });

  el.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const report = SEED_REPORTS.find(r => r.id === id);
      const shareUrl = `${window.location.origin}/#reporte-${id}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          window.showToast?.('Enlace del reporte copiado al portapapeles', 'info');
        }).catch(() => {
          window.showToast?.('Enlace copiado al portapapeles', 'info');
        });
      } else {
        window.showToast?.('Enlace copiado al portapapeles', 'info');
      }
    });
  });
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
  renderCategoryPills();
  renderFeed();
  renderRanking();
  renderFeatures();
}
