/* =====================================================
   CITRINO TIENDA — Main JavaScript
   ===================================================== */

/* ── State ────────────────────────────────────────── */
const state = {
  gender:   'all',
  family:   'all',
  occasion: 'all',
  search:   '',
  sort:     'recommended',
  page:     1
};

const ITEMS_PER_PAGE = 12;

/* ── Formatters ───────────────────────────────────── */
const formatPrice = (n) =>
  '$' + n.toLocaleString('es-CO');

/* Obtiene la tabla de tallas del producto (custom o global) */
const getProductSizes = (product) => product.sizes || SIZES;
const defaultSize     = (product) => getProductSizes(product).find(s => s.ml === DEFAULT_SIZE_ML) || getProductSizes(product).at(-1);
const minPrice        = (product) => Math.min(...getProductSizes(product).map(s => s.price));

/* ── WhatsApp helpers ─────────────────────────────── */
const waLink = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

function productWaLink(product, selectedMl) {
  const sizeInfo = selectedMl ? ` — Presentación: ${selectedMl}` : '';
  return waLink(
    `Hola, vengo del catálogo de Citrino Tienda. Me interesa consultar disponibilidad de la fragancia: ${product.name}${sizeInfo}.`
  );
}
function occasionWaLink(occasion) {
  return waLink(`Hola, quiero que me ayuden a elegir una fragancia para ${occasion}.`);
}
function generalWaLink() {
  return waLink('Hola, me gustaría conocer más sobre las fragancias de Citrino Tienda.');
}

/* ── Theme ────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('citrino-theme', theme);
}
function initTheme() {
  const saved  = localStorage.getItem('citrino-theme');
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || system);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

/* ── Header scroll ────────────────────────────────── */
function initHeaderScroll() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── Mobile menu ──────────────────────────────────── */
function initMobileMenu() {
  const btn  = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  });
  menu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
    });
  });
}

/* ── WhatsApp buttons ─────────────────────────────── */
function initWaButtons() {
  ['header-whatsapp-btn','mobile-whatsapp-btn','contact-whatsapp-btn','footer-cta-whatsapp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = generalWaLink();
  });
  const footerWa = document.getElementById('footer-whatsapp');
  if (footerWa) footerWa.href = generalWaLink();
  document.querySelectorAll('.hero-whatsapp-btn').forEach(el => { el.href = generalWaLink(); });
  document.querySelectorAll('.aroma-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.open(occasionWaLink(btn.getAttribute('data-occasion')), '_blank', 'noopener');
    });
  });

  const waDisplay  = document.getElementById('contact-whatsapp-display');
  const igDisplay  = document.getElementById('contact-instagram-display');
  const hoursEl   = document.getElementById('contact-hours-display');
  const covEl     = document.getElementById('contact-coverage-display');
  const igFooter  = document.getElementById('footer-instagram');

  if (waDisplay)  waDisplay.textContent  = '+' + WHATSAPP_NUMBER;
  if (igDisplay)  igDisplay.textContent  = INSTAGRAM_HANDLE;
  if (hoursEl)    hoursEl.textContent    = ATTENTION_HOURS;
  if (covEl)      covEl.textContent      = COVERAGE_AREA;
  if (igFooter)   igFooter.href          = `https://instagram.com/${INSTAGRAM_HANDLE.replace('@','')}/`;
}

/* ── Bottle SVG placeholder ───────────────────────── */
function bottleSVG(color = '#D9B34A', size = 80) {
  return `<svg width="${size}" height="${Math.round(size*1.55)}" viewBox="0 0 52 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="card-bottle-icon" aria-hidden="true">
    <rect x="20" y="0"  width="12" height="7"  rx="2"  fill="${color}" opacity="0.8"/>
    <rect x="22" y="7"  width="8"  height="10" fill="${color}" opacity="0.7"/>
    <rect x="16" y="15" width="20" height="4"  rx="2"  fill="${color}"/>
    <rect x="8"  y="19" width="36" height="52" rx="8"  fill="${color}" opacity="0.55"/>
    <rect x="13" y="25" width="26" height="34" rx="5"  fill="white"   opacity="0.18"/>
    <circle cx="39" cy="22" r="3"   fill="${color}" opacity="0.7"/>
    <circle cx="44" cy="17" r="1.5" fill="${color}" opacity="0.5"/>
  </svg>`;
}

/* ── Image area (real photo or placeholder) ───────── */
function cardImageHTML(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${product.name}" class="card-img-real" loading="lazy">`;
  }
  return `<div class="card-image-inner" style="background:linear-gradient(145deg,${product.gradientFrom}28,${product.gradientTo}44,${product.gradientFrom}1A);">
    ${bottleSVG(product.gradientTo, 72)}
  </div>`;
}

function modalImageHTML(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${product.name}" class="modal-img-real">`;
  }
  if (product.referenceImage) {
    return `
      <div class="modal-ref-wrap">
        <img src="${product.referenceImage}"
             alt="Fragancia de referencia: ${product.inspiredBy || product.name}"
             class="modal-ref-img"
             loading="lazy">
        <div class="modal-ref-badge">
          <span class="modal-ref-badge-icon">✦</span>
          Inspirada en
        </div>
      </div>`;
  }
  return `<div class="modal-bottle-wrap">${bottleSVG(product.gradientTo, 120)}</div>`;
}

/* ── Create product card ──────────────────────────── */
function createCard(product) {
  const card    = document.createElement('article');
  card.className = 'product-card fade-in';
  card.setAttribute('data-id', product.id);

  const sizes   = getProductSizes(product);
  const defSize = defaultSize(product);
  const tagHTML = product.tag
    ? `<span class="card-tag card-tag-${product.tagType}">${product.tag}</span>` : '';

  const waIconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>`;

  card.innerHTML = `
    <div class="card-image">
      ${cardImageHTML(product)}
      ${tagHTML}
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="card-badge card-badge-gender">${product.gender}</span>
        <span class="card-badge">${product.family}</span>
      </div>
      <h3 class="card-name">${product.name}</h3>

      <div class="card-size-section">
        <span class="card-size-label">Presentación</span>
        <div class="card-size-chips" role="group" aria-label="Seleccionar presentación de ${product.name}">
          ${sizes.map(s => `
            <button class="card-size-chip${s.ml === defSize.ml ? ' active' : ''}"
                    data-ml="${s.ml}" data-price="${s.price}"
                    aria-pressed="${s.ml === defSize.ml}">
              ${s.ml}
            </button>`).join('')}
        </div>
      </div>

      <div class="card-price-row">
        <span class="card-price" data-price="${defSize.price}">${formatPrice(defSize.price)}</span>
        <span class="card-selected-ml">${defSize.ml}</span>
      </div>

      <div class="card-actions">
        <button class="card-btn-detail" data-id="${product.id}" aria-label="Ver detalles de ${product.name}">
          Ver detalles
        </button>
        <button class="card-btn-wa" aria-label="Consultar ${product.name} por WhatsApp">
          ${waIconSVG}
        </button>
      </div>
    </div>`;

  /* ── Chip interaction ── */
  const priceEl    = card.querySelector('.card-price');
  const selectedMlEl = card.querySelector('.card-selected-ml');
  const waBtn      = card.querySelector('.card-btn-wa');

  let currentMl = defSize.ml;

  const updateCard = (ml, price) => {
    currentMl = ml;
    // Animate price
    priceEl.classList.add('price-flash');
    setTimeout(() => {
      priceEl.textContent = formatPrice(price);
      priceEl.classList.remove('price-flash');
    }, 110);
    selectedMlEl.textContent = ml;
  };

  card.querySelectorAll('.card-size-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      card.querySelectorAll('.card-size-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      updateCard(chip.dataset.ml, parseInt(chip.dataset.price));
    });
  });

  /* ── Button events ── */
  card.querySelector('.card-btn-detail').addEventListener('click', () => openModal(product.id, currentMl));
  waBtn.addEventListener('click', () => {
    window.open(productWaLink(product, currentMl), '_blank', 'noopener');
  });

  return card;
}

/* ── Render grid ──────────────────────────────────── */
function renderProducts(products) {
  const grid     = document.getElementById('products-grid');
  const empty    = document.getElementById('empty-state');
  const countEl  = document.getElementById('results-count');
  const clearBtn = document.getElementById('clear-filters');
  const paginationEl = document.getElementById('catalog-pagination');

  grid.innerHTML = '';

  const hasFilter =
    state.gender !== 'all' || state.family !== 'all' ||
    state.occasion !== 'all' || state.search !== '';

  if (clearBtn) clearBtn.style.display = hasFilter ? 'inline-flex' : 'none';

  if (products.length === 0) {
    empty.hidden = false;
    paginationEl.hidden = true;
    countEl.innerHTML = '<strong>0</strong> fragancias encontradas';
    return;
  }

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  if (state.page > totalPages) state.page = totalPages;

  const start   = (state.page - 1) * ITEMS_PER_PAGE;
  const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);
  const end     = start + pageProducts.length;

  empty.hidden = true;
  countEl.innerHTML = `Mostrando <strong>${start + 1}–${end}</strong> de <strong>${products.length}</strong> fragancias`;

  pageProducts.forEach(p => grid.appendChild(createCard(p)));
  requestAnimationFrame(() => {
    grid.querySelectorAll('.fade-in').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 40);
    });
  });

  /* ── Paginación ── */
  if (totalPages <= 1) {
    paginationEl.hidden = true;
    return;
  }
  paginationEl.hidden = false;

  const prevBtn     = document.getElementById('page-prev');
  const nextBtn     = document.getElementById('page-next');
  const numbersEl   = document.getElementById('page-numbers');
  prevBtn.disabled  = state.page === 1;
  nextBtn.disabled  = state.page === totalPages;

  /* Genera los números de página visibles (máx 7 botones) */
  const pages = buildPageRange(state.page, totalPages);
  numbersEl.innerHTML = '';
  pages.forEach(p => {
    if (p === '…') {
      const dots = document.createElement('span');
      dots.className = 'page-dots';
      dots.textContent = '…';
      numbersEl.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'page-num' + (p === state.page ? ' active' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', `Página ${p}`);
      btn.setAttribute('aria-current', p === state.page ? 'page' : 'false');
      btn.addEventListener('click', () => goToPage(p, products));
      numbersEl.appendChild(btn);
    }
  });

  prevBtn.onclick = () => goToPage(state.page - 1, products);
  nextBtn.onclick = () => goToPage(state.page + 1, products);
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function goToPage(page, products) {
  state.page = page;
  renderProducts(products);
}

/* ── Search helpers ───────────────────────────────── */

/* Quita acentos y pasa a minúsculas para comparar sin importar tildes */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/* Puntúa qué tan bien coincide un producto con la query */
function scoreProduct(p, normQuery, words) {
  const name   = normalize(p.name);
  const family = normalize(p.family);
  const desc   = normalize(p.description);
  const notes  = normalize(`${p.notes.top} ${p.notes.heart} ${p.notes.base}`);
  const full   = `${name} ${family} ${desc} ${notes}`;

  /* Coincidencia exacta del nombre → máxima prioridad */
  if (name === normQuery) return 1000;

  /* El nombre empieza con la query */
  if (name.startsWith(normQuery)) return 800;

  /* El nombre contiene la query completa */
  if (name.includes(normQuery)) return 600;

  /* Todas las palabras están en el nombre */
  if (words.every(w => name.includes(w))) return 500;

  /* Todas las palabras están en cualquier campo */
  if (words.every(w => full.includes(w))) return 300;

  /* Al menos la mitad de palabras coinciden en algún campo */
  const matchCount = words.filter(w => full.includes(w)).length;
  if (matchCount > 0) return 100 * (matchCount / words.length);

  return 0;
}

function searchProducts(list, query) {
  const normQuery = normalize(query.trim());
  if (!normQuery) return list;

  const words = normQuery.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return list;

  return list
    .map(p => ({ p, score: scoreProduct(p, normQuery, words) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ p }) => p);
}

/* ── Filters ──────────────────────────────────────── */
function getFiltered() {
  let list = [...PRODUCTS];

  if (state.gender   !== 'all') list = list.filter(p => p.gender     === state.gender);
  if (state.family   !== 'all') list = list.filter(p => p.familyKey  === state.family);
  if (state.occasion !== 'all') list = list.filter(p => p.occasions.includes(state.occasion));

  if (state.search) {
    list = searchProducts(list, state.search);
  }

  switch (state.sort) {
    case 'price-asc':  list.sort((a, b) => minPrice(a) - minPrice(b)); break;
    case 'price-desc': list.sort((a, b) => minPrice(b) - minPrice(a)); break;
    case 'newest':     list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    default:           list.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
  }
  return list;
}

function refresh() { state.page = 1; renderProducts(getFiltered()); }

/* ── Filter chips ─────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type  = chip.getAttribute('data-filter-type');
      const value = chip.getAttribute('data-filter-value');
      chip.closest('.chips-row').querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active'); c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      state[type] = value;
      refresh();
    });
  });

  document.querySelectorAll('.category-card[data-filter-gender]').forEach(card => {
    card.addEventListener('click', () => { setChipFilter('gender', card.getAttribute('data-filter-gender')); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
  });
  document.querySelectorAll('.category-card[data-filter-family]').forEach(card => {
    card.addEventListener('click', () => { setChipFilter('family', card.getAttribute('data-filter-family')); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
  });
  document.querySelectorAll('.category-card[data-filter-occasion]').forEach(card => {
    card.addEventListener('click', () => { setChipFilter('occasion', card.getAttribute('data-filter-occasion')); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
  });
}

function setChipFilter(type, value) {
  state[type] = value;
  const row = document.querySelector(`.filter-chip[data-filter-type="${type}"][data-filter-value="${value}"]`)?.closest('.chips-row');
  if (row) {
    row.querySelectorAll('.filter-chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
    const target = row.querySelector(`[data-filter-value="${value}"]`);
    if (target) { target.classList.add('active'); target.setAttribute('aria-pressed', 'true'); }
  }
  refresh();
}

function clearAllFilters() {
  state.gender = state.family = state.occasion = 'all';
  state.search = '';
  document.querySelectorAll('.filter-chip[data-filter-value="all"]').forEach(c => { c.classList.add('active'); c.setAttribute('aria-pressed', 'true'); });
  document.querySelectorAll('.filter-chip:not([data-filter-value="all"])').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
  const searchEl = document.getElementById('catalog-search');
  if (searchEl) searchEl.value = '';
  const sortEl = document.getElementById('catalog-sort');
  if (sortEl) { sortEl.value = 'recommended'; state.sort = 'recommended'; }
  refresh();
}

function initSearch() {
  const el = document.getElementById('catalog-search');
  if (!el) return;
  let debounce;
  el.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.search = el.value.trim(); refresh(); }, 280);
  });
}
function initSort() {
  const el = document.getElementById('catalog-sort');
  if (!el) return;
  el.addEventListener('change', () => { state.sort = el.value; refresh(); });
}
function initClearButtons() {
  ['clear-filters','clear-filters-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', clearAllFilters);
  });
}

/* ── Modal ────────────────────────────────────────── */
function openModal(productId, preselectedMl) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const overlay = document.getElementById('product-modal');
  const body    = document.getElementById('modal-body');

  const sizes   = getProductSizes(product);
  const defSize = preselectedMl
    ? (sizes.find(s => s.ml === preselectedMl) || defaultSize(product))
    : defaultSize(product);

  const sizePickerHTML = `
    <div class="modal-size-section">
      <p class="modal-section-label">Presentación</p>
      <div class="size-picker" id="modal-size-picker">
        ${sizes.map(s => `
          <button class="size-btn${s.ml === defSize.ml ? ' active' : ''}"
                  data-ml="${s.ml}" data-price="${s.price}"
                  aria-pressed="${s.ml === defSize.ml}">
            <span class="size-btn-ml">${s.ml}</span>
            <span class="size-btn-price">${formatPrice(s.price)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  const occasionsHTML = product.occasions.map(o => `<span class="occasion-chip">${o}</span>`).join('');

  body.innerHTML = `
    <div class="modal-layout">
      <div class="modal-image-col">
        ${modalImageHTML(product)}
      </div>
      <div class="modal-info-col">
        <div class="modal-badges">
          <span class="card-badge card-badge-gender">${product.gender}</span>
          <span class="card-badge">${product.family}</span>
          ${product.tag ? `<span class="card-badge" style="color:var(--accent-strong);border-color:var(--accent);">${product.tag}</span>` : ''}
        </div>
        <div>
          <h2 class="modal-product-name" id="modal-product-name">${product.name}</h2>
          <p class="modal-product-family">${product.family} · ${getProductSizes(product)[0].ml}</p>
        </div>
        <p class="modal-price" id="modal-price">${formatPrice(defSize.price)}</p>
        <p class="modal-description">${product.description}</p>

        ${sizePickerHTML}

        <div>
          <p class="modal-section-label">Notas olfativas</p>
          <div class="modal-notes">
            <div class="modal-note-tier"><h5>Salida</h5><p>${product.notes.top}</p></div>
            <div class="modal-note-tier"><h5>Corazón</h5><p>${product.notes.heart}</p></div>
            <div class="modal-note-tier"><h5>Fondo</h5><p>${product.notes.base}</p></div>
          </div>
        </div>

        ${product.accords && product.accords.length ? `
        <div>
          <p class="modal-section-label">Acordes principales</p>
          <div class="modal-accords">
            ${product.accords.map(a => `
              <div class="modal-accord-row">
                <div class="modal-accord-bar" style="width:${a.weight}%;background:${a.color}">
                  <span class="modal-accord-name">${a.name}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <div class="modal-details-row">
          <div class="modal-detail-chip"><span>Intensidad</span><span>${product.intensity}</span></div>
          <div class="modal-detail-chip"><span>Duración</span><span>${product.duration}</span></div>
          <div class="modal-detail-chip"><span>Presentación</span><span id="modal-selected-size">${defSize.ml}</span></div>
        </div>

        <div>
          <p class="modal-section-label">Ocasiones recomendadas</p>
          <div class="modal-occasions">${occasionsHTML}</div>
        </div>

        <div class="modal-footer">
          <a href="${productWaLink(product, defSize.ml)}" target="_blank" rel="noopener" class="btn-primary" id="modal-wa-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>`;

  // Size picker interactivity
  {
    body.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        body.querySelectorAll('.size-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const ml    = btn.getAttribute('data-ml');
        const price = parseInt(btn.getAttribute('data-price'));
        document.getElementById('modal-price').textContent        = formatPrice(price);
        document.getElementById('modal-selected-size').textContent = ml;
        document.getElementById('modal-wa-btn').href              = productWaLink(product, ml);
      });
    });
  }

  overlay.classList.add('open');
  overlay.removeAttribute('aria-hidden');

  /* iOS-safe scroll lock */
  const scrollY = window.scrollY;
  document.body.dataset.scrollY = scrollY;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow  = 'hidden';
  document.body.style.position  = 'fixed';
  document.body.style.top       = `-${scrollY}px`;
  document.body.style.width     = '100%';

  overlay.querySelector('.modal-container').focus();
}

function closeModal() {
  const overlay   = document.getElementById('product-modal');
  const container = overlay.querySelector('.modal-container');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');

  /* Clear any inline styles left over from a swipe so CSS transition can run cleanly */
  if (container) {
    container.style.transform  = '';
    container.style.transition = '';
  }

  /* Restore page scroll (iOS-safe) */
  const scrollY = parseInt(document.body.dataset.scrollY || '0');
  document.documentElement.style.overflow = '';
  document.body.style.overflow  = '';
  document.body.style.position  = '';
  document.body.style.top       = '';
  document.body.style.width     = '';
  window.scrollTo(0, scrollY);
}

function initModal() {
  const overlay   = document.getElementById('product-modal');
  const closeBtn  = document.getElementById('modal-close');
  const container = overlay.querySelector('.modal-container');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  /*
   * Swipe-to-close via a dedicated drag zone at the top of the container.
   * We intentionally do NOT attach any touchmove listener to the container
   * itself or to #modal-body — this lets the browser handle #modal-body
   * scroll natively without any passive:false interference.
   * The body is already position:fixed when open, so no page-scroll leaks.
   */
  const swipeZone = document.createElement('div');
  swipeZone.className = 'modal-swipe-zone';
  swipeZone.setAttribute('aria-hidden', 'true');
  container.prepend(swipeZone);

  let swipeStartY = 0;
  let isSwiping   = false;

  swipeZone.addEventListener('touchstart', e => {
    swipeStartY = e.touches[0].clientY;
    isSwiping   = false;
    container.style.transition = 'none';
  }, { passive: true });

  swipeZone.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - swipeStartY;
    if (dy > 0) {
      isSwiping = true;
      container.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  }, { passive: false });

  swipeZone.addEventListener('touchend', e => {
    /* If we never started swiping, nothing to undo — leave inline styles alone */
    if (!isSwiping) {
      container.style.transition = '';
      return;
    }
    const dy = e.changedTouches[0].clientY - swipeStartY;
    container.style.transition = 'transform 0.32s cubic-bezier(0.32,0.72,0,1)';
    if (dy > 80) {
      container.style.transform = 'translateY(110%)';
      setTimeout(() => {
        container.style.transform  = '';
        container.style.transition = '';
        closeModal();
      }, 320);
    } else {
      container.style.transform = 'translateY(0)';
      setTimeout(() => {
        container.style.transform  = '';
        container.style.transition = '';
      }, 320);
    }
    isSwiping = false;
  }, { passive: true });
}

/* ── Scroll animations ────────────────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ── Hero Carousel ───────────────────────────────── */
function initHeroCarousel() {
  const carousel = document.getElementById('hero-carousel');
  if (!carousel) return;

  const cards = carousel.querySelectorAll('.hero-float-card');
  const COUNT = cards.length;
  let current = 0;

  function goTo(idx) {
    cards[current].classList.remove('hfc-active');
    current = (idx + COUNT) % COUNT;
    cards[current].classList.add('hfc-active');
  }

  setInterval(() => goTo(current + 1), 3000);
}

/* ── Init ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHeaderScroll();
  initMobileMenu();
  initWaButtons();

  renderProducts(getFiltered());
  initHeroCarousel();

  initFilters();
  initSearch();
  initSort();
  initClearButtons();
  initModal();
  initScrollAnimations();

  // Watch for new cards and animate them
  const grid   = document.getElementById('products-grid');
  const mobObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); mobObs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  new MutationObserver(() => {
    grid.querySelectorAll('.fade-in:not(.visible)').forEach(el => mobObs.observe(el));
  }).observe(grid, { childList: true });
});
