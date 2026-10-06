// F6 — Feed tipo Instagram: scroll infinito por cursor, filtro por categoría, likes y comentarios.
import { api, assetUrl } from './api.js';

const CATEGORIES = [
  { label: 'Todos', color: '#10B981' },
  { label: 'Infraestructura', color: '#F59E0B' },
  { label: 'Alumbrado', color: '#FACC15' },
  { label: 'Aseo', color: '#10B981' },
  { label: 'Seguridad', color: '#EF4444' },
  { label: 'Otros', color: '#6366F1' },
];

const SVG = {
  heart:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  comment:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  pin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

const state = { categoria: null, cursor: null, done: false, loading: false, gen: 0, observer: null };
let feedEl;
let listEl;
let sentinel;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(svg) {
  const span = el('span', 'icon-slot');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = svg; // SVG estático, sin datos de usuario
  return span;
}

export function timeAgo(iso) {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function stateBox(title, message, actionLabel, onAction) {
  const box = el('div', 'state-box');
  box.append(el('p', 'state-title', title));
  if (message) box.append(el('p', 'state-msg', message));
  if (actionLabel) {
    const btn = el('button', 'btn-secondary mt-3', actionLabel);
    btn.type = 'button';
    btn.addEventListener('click', onAction);
    box.append(btn);
  }
  return box;
}

// ───────────── Tarjeta ─────────────
function buildCard(item) {
  const card = el('article', 'report-card');
  card.id = `card-${item.id}`;

  const imgWrap = el('div', 'card-img-wrap');
  const img = el('img', 'card-photo');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = assetUrl(item.foto_url);
  img.alt = `Foto del reporte: ${item.descripcion.slice(0, 80)}`;
  imgWrap.append(img);
  if (item.categoria) {
    const badge = el('span', 'card-cat-badge');
    const dot = el('span', 'card-cat-dot');
    dot.style.background = item.color || '#6366F1';
    badge.append(dot, document.createTextNode(item.categoria));
    imgWrap.append(badge);
  }
  if (item.severidad) imgWrap.append(el('span', 'card-sev-badge', `Severidad ${item.severidad}/5`));
  card.append(imgWrap);

  const body = el('div', 'card-body');

  const author = el('div', 'card-author');
  const info = el('div', 'card-author-info');
  const initials = item.autor.anonimo
    ? '—'
    : item.autor.nombre.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const avatar = el('div', 'author-avatar', initials);
  avatar.setAttribute('aria-hidden', 'true');
  const names = el('div');
  names.append(
    el('div', 'author-name', item.autor.anonimo ? 'Ciudadano anónimo' : item.autor.nombre),
    el('div', 'author-level', item.autor.nivel),
  );
  info.append(avatar, names);
  author.append(info, el('span', 'card-time', timeAgo(item.creado_en)));
  body.append(author);

  body.append(el('p', 'card-desc', item.descripcion));

  const meta = el('div', 'card-meta-row');
  const loc = el('div', 'card-location');
  loc.append(icon(SVG.pin), el('span', undefined, item.barrio || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`));
  meta.append(loc);
  body.append(meta);

  // ── Acciones ──
  const actions = el('div', 'card-actions');

  const likeBtn = el('button', 'card-action-btn like-btn');
  likeBtn.type = 'button';
  const likeCount = el('span', 'like-count', String(item.likes));
  likeBtn.append(icon(SVG.heart), likeCount);
  const paintLike = () => {
    likeBtn.classList.toggle('active', item.liked_por_mi);
    likeBtn.setAttribute('aria-pressed', String(item.liked_por_mi));
    likeBtn.setAttribute('aria-label', item.liked_por_mi ? 'Quitar me gusta' : 'Me gusta');
  };
  paintLike();
  likeBtn.addEventListener('click', async () => {
    likeBtn.disabled = true;
    try {
      const res = await api.toggleLike(item.id);
      item.liked_por_mi = res.liked;
      item.likes = res.likes;
      likeCount.textContent = String(res.likes);
      paintLike();
      likeBtn.classList.remove('pop');
      void likeBtn.offsetWidth; // reinicia la animación
      likeBtn.classList.add('pop');
    } catch (err) {
      window.showToast?.(err.message, 'error');
    } finally {
      likeBtn.disabled = false;
    }
  });

  const commentBtn = el('button', 'card-action-btn comment-btn');
  commentBtn.type = 'button';
  commentBtn.setAttribute('aria-expanded', 'false');
  const commentCount = el('span', 'comment-count', String(item.comentarios));
  commentBtn.append(icon(SVG.comment), commentCount);
  actions.append(likeBtn, commentBtn);
  body.append(actions);

  const panel = buildCommentsPanel(item, commentCount);
  panel.hidden = true;
  body.append(panel);
  commentBtn.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    commentBtn.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden && !panel.dataset.loaded) panel.loadComments();
  });

  card.append(body);
  return card;
}

function buildCommentsPanel(item, countEl) {
  const panel = el('div', 'comments-panel');
  const list = el('div', 'comments-list');
  const form = el('form', 'comment-form');
  const input = el('input', 'form-input');
  input.type = 'text';
  input.maxLength = 300;
  input.placeholder = 'Escribe un comentario…';
  input.setAttribute('aria-label', 'Escribir comentario');
  const send = el('button', 'btn-primary', 'Enviar');
  send.type = 'submit';
  form.append(input, send);
  panel.append(list, form);

  const addRow = (c) => {
    const row = el('div', 'comment-row');
    row.append(el('strong', undefined, c.autor.nombre), document.createTextNode(' '), el('span', undefined, c.texto));
    list.append(row);
  };

  panel.loadComments = async () => {
    panel.dataset.loaded = '1';
    list.replaceChildren(el('p', 'state-msg', 'Cargando comentarios…'));
    try {
      const comments = await api.getComments(item.id);
      list.replaceChildren();
      if (!comments.length) list.append(el('p', 'state-msg', 'Sé el primero en comentar.'));
      else comments.forEach(addRow);
    } catch (err) {
      delete panel.dataset.loaded;
      list.replaceChildren(el('p', 'state-msg', err.message));
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto || send.disabled) return;
    send.disabled = true;
    try {
      const c = await api.addComment(item.id, texto);
      if (list.querySelector('.state-msg')) list.replaceChildren();
      addRow(c);
      input.value = '';
      item.comentarios += 1;
      countEl.textContent = String(item.comentarios);
    } catch (err) {
      window.showToast?.(err.message, 'error');
    } finally {
      send.disabled = false;
    }
  });
  return panel;
}

// ───────────── Carga y scroll infinito ─────────────
function isLogged() {
  return !!window.CIVIC_SESSION?.isLogged();
}

async function loadMore() {
  if (state.loading || state.done || !isLogged()) return;
  state.loading = true;
  const gen = state.gen;
  let ok = false;
  sentinel.textContent = 'Cargando…';
  try {
    const page = await api.getFeed({ cursor: state.cursor, categoria: state.categoria });
    if (gen !== state.gen) return; // llegó una respuesta de un filtro anterior
    page.items.forEach((item) => listEl.append(buildCard(item)));
    state.cursor = page.next_cursor;
    state.done = !page.next_cursor;
    ok = true;
    if (!listEl.children.length) {
      feedEl.replaceChildren(
        stateBox(
          state.categoria ? 'No hay incidencias en esta categoría' : 'Aún no hay incidencias',
          'Puedes registrar un reporte en tu sector.',
        ),
      );
    }
  } catch (err) {
    if (gen !== state.gen) return;
    if (!listEl.children.length) {
      feedEl.replaceChildren(stateBox('No pudimos cargar el feed', err.message, 'Reintentar', resetFeed));
    } else {
      window.showToast?.(err.message, 'error');
    }
  } finally {
    if (gen === state.gen) {
      state.loading = false;
      sentinel.textContent = '';
      if (ok && !state.done && state.observer) {
        // Si el centinela sigue a la vista, el observer no se dispara solo: lo reiniciamos.
        state.observer.unobserve(sentinel);
        state.observer.observe(sentinel);
      }
    }
  }
}

function resetFeed() {
  state.gen += 1;
  state.cursor = null;
  state.done = false;
  state.loading = false;
  state.observer?.disconnect();

  if (!isLogged()) {
    feedEl.replaceChildren(
      stateBox(
        'Inicia sesión para ver las incidencias',
        'El feed de la comunidad está disponible para usuarios registrados.',
        'Iniciar sesión',
        () => window.showScreen?.('auth'),
      ),
    );
    return;
  }

  listEl = el('div', 'cards-list');
  sentinel = el('div', 'feed-sentinel');
  sentinel.setAttribute('aria-live', 'polite');
  feedEl.replaceChildren(listEl, sentinel);

  state.observer = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && loadMore(),
    { rootMargin: '300px' },
  );
  state.observer.observe(sentinel);
}

function renderPills(container) {
  container.replaceChildren();
  const group = el('div', 'category-pills');
  CATEGORIES.forEach((cat) => {
    const active = (state.categoria || 'Todos') === cat.label;
    const btn = el('button', `pill${active ? ' active' : ''}`);
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(active));
    const dot = el('span', 'pill-dot');
    dot.style.background = cat.color;
    btn.append(dot, document.createTextNode(cat.label));
    btn.addEventListener('click', () => {
      state.categoria = cat.label === 'Todos' ? null : cat.label;
      renderPills(container);
      resetFeed();
    });
    group.append(btn);
  });
  container.append(group);
}

export function initFeed() {
  feedEl = document.getElementById('home-feed');
  const pills = document.getElementById('home-pills');
  if (!feedEl || !pills) return;
  renderPills(pills);
  resetFeed();
  document.addEventListener('civic:login', resetFeed);
  document.addEventListener('civic:logout', resetFeed);
  document.addEventListener('civic:report-created', resetFeed);
}
