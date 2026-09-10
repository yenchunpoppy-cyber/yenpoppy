/**
 * YEN POPPY â åå°æ ¸å¿ JS
 * è¦æ ¼æ¸ v1 å®æ´å°æ
 */

'use strict';

// âââââââââââââââââââââââââââââââââââââââââââââ
// è³æå¿«å
// âââââââââââââââââââââââââââââââââââââââââââââ
const Cache = {};

// âââââââââââââââââââââââââââââââââââââââââââââ
// UTF-8 ééç·¨ç¢¼ä¿®å¾©
// âââââââââââââââââââââââââââââââââââââââââââââ
function fixUtf8(val) {
  if (typeof val === 'string') {
    for (let i = 0; i < val.length; i++) if (val.charCodeAt(i) > 255) return val;
    let hasHigh = false;
    for (let i = 0; i < val.length; i++) if (val.charCodeAt(i) > 127) { hasHigh = true; break; }
    if (!hasHigh) return val;
    try {
      const b = new Uint8Array(val.length);
      for (let i = 0; i < val.length; i++) b[i] = val.charCodeAt(i) & 0xFF;
      return new TextDecoder('utf-8').decode(b);
    } catch(e) { return val; }
  }
  if (Array.isArray(val)) return val.map(fixUtf8);
  if (val && typeof val === 'object') {
    const o = {};
    for (const k of Object.keys(val)) o[k] = fixUtf8(val[k]);
    return o;
  }
  return val;
}


// âââââââââââââââââââââââââââââââââââââââââââââ
// åçè·¯å¾ä¿®å¾©ï¼Wix uploads â Wix CDNï¼
// âââââââââââââââââââââââââââââââââââââââââââââ
function fixImgUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/')) {
    return '/public' + url;
  }
  return url;
}


async function fetchJSON(path) {
  if (Cache[path]) return Cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path} â ${res.status}`);
  const data = fixUtf8(await res.json());
  Cache[path] = data;
  return data;
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// æç¨åçè¨­å®
// âââââââââââââââââââââââââââââââââââââââââââââ
async function applySettings() {
  const s = await fetchJSON('/data/settings.json');
  const root = document.documentElement;

  if (s.headerBg)  root.style.setProperty('--header-bg',   s.headerBg);
  if (s.siteBg)    root.style.setProperty('--site-bg',     s.siteBg);
  if (s.textColor) root.style.setProperty('--text-color',  s.textColor);

  // å­é«
  const fontMap = {
    'poppins-extralight': "'Poppins', sans-serif",
    'noto-serif-tc':      "'Noto Serif TC', serif",
    'noto-sans-tc':       "'Noto Sans TC', sans-serif",
    'all-serif':          "'Noto Serif TC', serif",
  };
  if (s.titleFont) root.style.setProperty('--font-title', fontMap[s.titleFont] || fontMap['poppins-extralight']);
  if (s.bodyFont)  root.style.setProperty('--font-body',  fontMap[s.bodyFont]  || fontMap['poppins-extralight']);

  // å¨ç« gutter é è¨­
  if (s.worksGutter !== undefined) {
    root.style.setProperty('--gutter', s.worksGutter + 'px');
  }

  // Logo
  const header = document.getElementById('site-header');
  if (header) {
    const logoMark = header.querySelector('.logo-mark');
    const logoWordmark = header.querySelector('.logo-wordmark');
    if (logoMark && s.logoMark)     { logoMark.src = fixImgUrl(s.logoMark); logoMark.style.display = 'block'; }
    if (logoWordmark && s.logoWordmark) { logoWordmark.src = fixImgUrl(s.logoWordmark); logoWordmark.style.display = 'block'; }
  }

  // Favicon
  if (s.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = fixImgUrl(s.favicon);
  }

  // è£é£¾è±ç´
  if (Array.isArray(s.decorations)) {
    renderDecorations(s.decorations);
  }

  return s;
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// è£é£¾è±ç´ï¼åºå®è¦çªè§è½ï¼
// âââââââââââââââââââââââââââââââââââââââââââââ
function renderDecorations(decorations) {
  const isMobile = window.innerWidth < 600;
  decorations.forEach((d, i) => {
    if (!d.image) return;
    if (d.mobileHide && isMobile) return;

    const el = document.createElement('div');
    el.className = `deco-pattern deco-${d.position || 'tr'} deco-${d.size || 'medium'}`;
    el.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = fixImgUrl(d.image);
    img.alt = '';
    el.appendChild(img);
    document.body.appendChild(el);
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// å°è¦½å
// âââââââââââââââââââââââââââââââââââââââââââââ
async function renderNav() {
  const data = await fetchJSON('/data/nav.json');
  const nav = document.getElementById('site-nav');
  const mobileNav = document.getElementById('mobile-nav');
  if (!nav) return;

  const currentSlug = getCurrentSlug();
  const currentPage = document.body.dataset.page; // 'works' | 'page' | 'work'

  data.items.forEach(item => {
    const href = item.type === 'works' ? '/' : `/pages/${item.page}`;
    const isActive = (item.type === 'works' && currentPage === 'works') ||
                     (item.type === 'page' && currentSlug === item.page);

    const a = document.createElement('a');
    a.href = href;
    a.textContent = item.label;
    if (isActive) a.classList.add('active');

    nav.appendChild(a.cloneNode(true));
    if (mobileNav) {
      const ma = a.cloneNode(true);
      ma.addEventListener('click', closeMobileNav);
      mobileNav.appendChild(ma);
    }
  });
}

// æ¼¢å ¡é¸å®
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    if (open) {
      mobileNav.classList.add('open');
      // éµç¤ç¦é»éå®å¨é¢æ¿å§ï¼è¦æ ¼æ¸ Â§5.5ï¼
      mobileNav.setAttribute('tabindex', '-1');
      mobileNav.focus();
    } else {
      closeMobileNav();
    }
  });

  // Esc ééï¼è¦æ ¼æ¸ Â§5.5ï¼
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileNav();
  });
}

function closeMobileNav() {
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (btn) btn.classList.remove('open');
  if (mobileNav) mobileNav.classList.remove('open');
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// URL å·¥å·
// âââââââââââââââââââââââââââââââââââââââââââââ
function getCurrentSlug() {
  // /page/social-media â 'social-media'
  // /work/et-seq-nail  â 'et-seq-nail'
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[1] || '';
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// WORKS ç¶²æ ¼é 
// âââââââââââââââââââââââââââââââââââââââââââââ
const WORKS_PAGE_SIZE = 24;

async function renderWorksGrid() {
  const [worksData, settings] = await Promise.all([
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  // é¦é èæ¯è²
  const homeBg = worksData.homeBg || settings.homeBg || settings.siteBg;
  if (homeBg) document.body.style.background = homeBg;

  // SEO title
  document.title = 'WORKS | YEN POPPY';

  const grid = document.getElementById('works-grid');
  if (!grid) return;

  const cols   = parseInt(worksData.homeColumns || '3', 10);
  const gutter = parseInt(worksData.homeGutter  || '12', 10);

  // è¨ç®å¤éçï¼gutter Ã 2ï¼gutter=0æå¤éçä¹=0ï¼
  const outerPad = gutter * 2;
  const content = document.getElementById('page-content');
  if (content) {
    content.style.padding = outerPad
      ? `${outerPad}px ${outerPad}px`
      : '0';
  }

  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gap = `${gutter}px`;
  grid.dataset.cols = cols;

  const works = worksData.works || [];
  let offset = 0;

  function loadMore() {
    const batch = works.slice(offset, offset + WORKS_PAGE_SIZE);
    batch.forEach(work => grid.appendChild(createWorkCard(work)));
    offset += batch.length;

    // ç§»é¤èå¨åµ
    const old = document.getElementById('scroll-sentinel');
    if (old) old.remove();

    // è¥éææ´å¤ï¼æ°å¢å¨åµè§¸ç¼ infinite scroll
    if (offset < works.length) {
      const sentinel = document.createElement('div');
      sentinel.id = 'scroll-sentinel';
      sentinel.style.height = '1px';
      grid.parentElement.appendChild(sentinel);

      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          loadMore();
        }
      }, { rootMargin: '200px' });
      observer.observe(sentinel);
    }
  }

  loadMore();
}

function createWorkCard(work) {
  const card = document.createElement('div');
  card.className = 'work-card';
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');
  card.style.cursor = 'pointer';

  const imgAlt = work.thumbnailAlt || work.title;

  if (work.thumbnail) {
    const img = document.createElement('img');
    img.src = fixImgUrl(work.thumbnail);
    img.alt = imgAlt;
    img.loading = 'lazy';
    // ä¿çé·å¯¬æ¯é¿åçé¢è·³å
    img.style.aspectRatio = '4/3';
    img.style.objectFit = 'cover';
    card.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'thumb-placeholder';
    card.appendChild(ph);
  }

  if (work.caption) {
    const cap = document.createElement('div');
    cap.className = 'card-caption';
    cap.textContent = work.caption;
    card.appendChild(cap);
  }
  if (work.title) {
    const tit = document.createElement('div');
    tit.className = 'card-title';
    tit.textContent = work.title;
    card.appendChild(tit);
  }

  const navigate = () => { location.href = `/works/${work.id}`; };
  card.addEventListener('click', navigate);
  card.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(); });

  return card;
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// æ¨¡å¡é æ¸²æï¼page.htmlï¼
// âââââââââââââââââââââââââââââââââââââââââââââ
async function renderModulePage() {
  const slug = getCurrentSlug();
  if (!slug) return;

  const [pageData, tagsData, worksData, settings] = await Promise.all([
    fetchJSON(`/data/pages/${slug}.json`),
    fetchJSON('/data/tags.json'),
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  // SEO
  document.title = (pageData.seoTitle || pageData.title) + ' | YEN POPPY';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && (pageData.seoDesc || pageData.title)) {
    metaDesc.content = pageData.seoDesc || pageData.title;
  }

  // é é¢èæ¯è²
  const bg = pageData.bg || settings.siteBg;
  if (bg) document.body.style.background = bg;

  const container = document.getElementById('page-content');
  if (!container) return;

  // éææ¨¡å¡
  (pageData.modules || []).forEach(mod => {
    const el = renderModule(mod, settings, pageData.bg);
    if (el) container.appendChild(el);
  });

  // æ¨ç±¤éæ¿¾é ï¼è¥æ­¤ slug å°ææå tagï¼é¡¯ç¤ºéæ¿¾å¾çä½åæ ¼
  const matchingTag = (tagsData.tags || []).find(t => t.page === slug);
  if (matchingTag) {
    const tagName = matchingTag.name;
    const filtered = (worksData.works || []).filter(w =>
      (w.tags || []).includes(tagName)
    );

    if (filtered.length > 0) {
      const cols    = parseInt(worksData.homeColumns || '3', 10);
      const gutter  = parseInt(worksData.homeGutter  || '12', 10);
      const outerPad = gutter * 2;

      const gridWrap = document.createElement('div');
      gridWrap.style.padding = outerPad ? `${outerPad}px` : '0';

      const grid = document.createElement('div');
      grid.id = 'works-grid';
      grid.setAttribute('role', 'list');
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gap = `${gutter}px`;
      grid.dataset.cols = cols;

      filtered.forEach(work => grid.appendChild(createWorkCard(work)));

      gridWrap.appendChild(grid);
      container.appendChild(gridWrap);
    }
  }
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// ä½åå§é æ¸²æï¼work.htmlï¼
// âââââââââââââââââââââââââââââââââââââââââââââ
async function renderWorkPage() {
  const slug = getCurrentSlug();
  if (!slug) return;

  const [worksData, settings] = await Promise.all([
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  const work = (worksData.works || []).find(w => w.id === slug);
  if (!work) {
    document.getElementById('page-content').textContent = 'æ¾ä¸å°æ­¤ä½å';
    return;
  }

  // SEO
  document.title = (work.seoTitle || work.title) + ' | YEN POPPY';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && work.seoDesc) metaDesc.content = work.seoDesc;

  // èæ¯è²æ²¿ç¨å¨ç«
  if (settings.siteBg) document.body.style.background = settings.siteBg;

  const container = document.getElementById('page-content');
  if (!container) return;

  // Work detail header: back link + title + caption
  const header = document.createElement('div');
  header.className = 'work-header';
  header.innerHTML = `
    <a class="work-header__back" href="/">← WORKS</a>
    <div class="work-header__titles">
      <h1 class="work-header__title">${work.title || ''}</h1>
      ${work.caption ? `<p class="work-header__caption">${work.caption}</p>` : ''}
    </div>
  `;
  container.appendChild(header);

  (work.modules || []).forEach(mod => {
    const el = renderModule(mod, settings, '');
    if (el) container.appendChild(el);
  });
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// éç¨ï¼æ¸²æä¸åæ¨¡å¡
// âââââââââââââââââââââââââââââââââââââââââââââ
function renderModule(mod, settings, pageBg) {
  if (!mod || !mod.type) return null;
  if (mod.type === 'module_a') return renderModuleA(mod, settings, pageBg);
  if (mod.type === 'module_b') return renderModuleB(mod, settings, pageBg);
  return null;
}

// ââ æ¨¡å¡ A ââ
function renderModuleA(mod, settings, pageBg) {
  const wrap = document.createElement('div');
  wrap.className = 'module-wrap';

  const cols    = mod.columns || '1';
  const gutter  = resolveGutter(mod.gutter, settings);
  const isFullWidth = cols === 'fullwidth';
  const hasBg   = mod.bg || pageBg;

  const section = document.createElement('section');
  section.className = 'module-a';
  if (isFullWidth) section.classList.add('module-a--fullwidth');
  if (mod.bg) section.style.background = mod.bg;

  // æ¨é¡ + è±ç·
  const hasHeadline = !!(mod.headline || (mod.body && mod.body.trim()));
  if (hasHeadline) {
    const header = document.createElement('div');
    header.className = 'module-a__header';

    // è±ç·ï¼ææ¨é¡æå ï¼
    if (mod.headline) {
      const decoLine = document.createElement('div');
      decoLine.className = 'module-a__deco-line';
      // é«åº¦é  flexbox èªåæå° header é«åº¦
      header.appendChild(decoLine);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'module-a__text';

    if (mod.headline) {
      const h = document.createElement('div');
      h.className = 'module-a__headline';
      h.textContent = mod.headline;
      textDiv.appendChild(h);
    }
    if (mod.body) {
      const b = document.createElement('div');
      b.className = 'module-a__body';
      b.innerHTML = markdownToHTML(mod.body);
      textDiv.appendChild(b);
    }

    header.appendChild(textDiv);
    section.appendChild(header);

    // è±ç·é«åº¦å°é½ï¼headline é å° body åºï¼ç¨ flexbox align-stretch èªç¶éæï¼
    const decoLineEl = header.querySelector('.module-a__deco-line');
    if (decoLineEl) decoLineEl.style.alignSelf = 'stretch';
  }

  // ç´æå­å°é½ï¼cols=0ï¼
  if (cols === '0') {
    const align = mod.textAlign || 'left';
    section.classList.add(`module-a--text-${align}`);
  }

  // åçå
  const images = mod.images || [];
  if (images.length && cols !== '0') {
    if (isFullWidth) {
      // æ»¿çï¼ä¸å¼µæå¤å¼µç´æ¥å¨å¯¬
      images.forEach(img => {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'img-wrap img-wrap--fit';
        appendImg(imgWrap, img, mod.headline);
        section.appendChild(imgWrap);
      });
    } else {
      const grid = document.createElement('div');
      grid.className = 'module-a__images';

      const numCols = parseInt(cols, 10) || 1;
      const isCrop  = numCols >= 2; // å©æ¬/ä¸æ¬è£å

      grid.style.gridTemplateColumns = cols === '1'
        ? '1fr'
        : `repeat(${numCols}, 1fr)`;
      grid.style.gap = `${gutter}px`;
      grid.dataset.cols = numCols;

      images.forEach(img => {
        const imgWrap = document.createElement('div');
        imgWrap.className = `img-wrap ${isCrop ? 'img-wrap--crop' : 'img-wrap--fit'}`;
        appendImg(imgWrap, img, mod.headline);
        grid.appendChild(imgWrap);
      });

      section.appendChild(grid);
    }
  }

  wrap.appendChild(section);
  return wrap;
}

// å¨ imgWrap å§å»ºåç + çå­
function appendImg(imgWrap, imgData, fallbackAlt) {
  if (!imgData.src) return;

  const img = document.createElement('img');
  img.src = fixImgUrl(imgData.src);
  img.alt = imgData.alt || fallbackAlt || '';
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  if (imgData.overlayText) {
    const grad = document.createElement('div');
    grad.className = 'img-overlay-gradient';
    grad.setAttribute('aria-hidden', 'true');
    imgWrap.appendChild(grad);

    const text = document.createElement('div');
    text.className = `img-overlay-text pos-${imgData.overlayPos || 'bc'}`;
    text.textContent = imgData.overlayText;
    imgWrap.appendChild(text);
  }
}

// ââ æ¨¡å¡ B ââ
function renderModuleB(mod, settings, pageBg) {
  const wrap = document.createElement('div');
  wrap.className = 'module-wrap';

  const section = document.createElement('section');
  section.className = 'module-b';
  if (mod.bg) section.style.background = mod.bg;

  const cols    = parseInt(mod.columns || '3', 10);
  const gutter  = resolveGutter(mod.gutter, settings);
  const images  = mod.images || [];

  const grid = document.createElement('div');
  grid.className = 'module-b__grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gap = `${gutter}px`;
  grid.dataset.cols = cols;

  images.forEach(imgData => {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'img-wrap';
    if (imgData.src) {
      const img = document.createElement('img');
      img.src = fixImgUrl(imgData.src);
      img.alt     = imgData.alt || '';
      img.loading = 'lazy';
      imgWrap.appendChild(img);
    }
    grid.appendChild(imgWrap);
  });

  section.appendChild(grid);
  wrap.appendChild(section);
  return wrap;
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// å·¥å·ï¼è§£æ gutter
// âââââââââââââââââââââââââââââââââââââââââââââ
function resolveGutter(modGutter, settings) {
  if (!modGutter || modGutter === 'default') {
    return parseInt(settings?.worksGutter || '12', 10);
  }
  return parseInt(modGutter, 10);
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// æå° Markdown â HTMLï¼ç²é«/æé«/é£çµï¼
// âââââââââââââââââââââââââââââââââââââââââââââ
function markdownToHTML(md) {
  if (!md) return '';
  return md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// âââââââââââââââââââââââââââââââââââââââââââââ
// åå§å
// âââââââââââââââââââââââââââââââââââââââââââââ
async function init() {
  // URL-based SPA routingï¼Cloudflare ææè·¯å¾é½åå³ index.htmlï¼
  const path = location.pathname;
  if (path.startsWith('/works/')) document.body.dataset.page = 'work';
  else if (path.startsWith('/pages/')) document.body.dataset.page = 'page';
  else document.body.dataset.page = 'works';
  const page = document.body.dataset.page;

  // åå¥è¨­å®ï¼logoãè²ç¥¨ãè±ç´ï¼ï¼åç®çé¢
  await applySettings().catch(console.warn);
  await renderNav().catch(console.warn);
  initHamburger();

  if (page === 'works') {
    await renderWorksGrid().catch(console.error);
  } else if (page === 'page') {
    await renderModulePage().catch(console.error);
  } else if (page === 'work') {
    await renderWorkPage().catch(console.error);
  }
}

document.addEventListener('DOMContentLoaded', init);
