/**
 * YEN POPPY â åå°æ ¸å¿ JS
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
    'brand':              "'Montserrat', 'Glow Sans TC', 'Noto Sans TC', sans-serif",
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
    if (logoWordmark && s.logoWordmark) { logoWordmark.src = fixImgUrl(s.logoWordmark); logoWordmark.style.display = 'block'; const fb = header.querySelector('.logo-fallback'); if (fb) fb.style.display = 'none'; }
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
    const href = item.type === 'works' ? '/' : item.type === 'link' ? (item.url || '/') : `/pages/${item.page}`;
    const isActive = (item.type === 'works' && currentPage === 'works') ||
                     (item.type === 'page' && currentPage === 'page' && currentSlug === item.page) ||
                     (item.type === 'link' && href.startsWith('/') && href !== '/' && location.pathname.startsWith(href.replace(/\/$/, '')));

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
  document.title = 'WORKS | YENPOPPY';

  const grid = document.getElementById('works-grid');
  if (!grid) return;

  const cols   = parseInt(worksData.homeColumns || '3', 10);
  const gutter = parseInt(worksData.homeGutter  || '12', 10);

  // è¨ç®å¤éçï¼gutter Ã 2ï¼gutter=0æå¤éçä¹=0ï¼
  const outerPad = gutter * 2;
  const content = document.getElementById('page-content');
  if (content) {
    // Side padding follows the header so the grid lines up with the logo
    content.style.padding = outerPad
      ? `${outerPad}px var(--page-pad)`
      : '0';
  }

  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gap = `${gutter}px`;
  grid.dataset.cols = cols;

  const allWorks = worksData.works || [];
  const tagsData = await fetchJSON('/data/tags.json').catch(() => ({ tags: [] }));
  let works = allWorks;
  let offset = 0;

  // Tag filter bar: ALL + tags that have at least one work
  const usedTags = (tagsData.tags || [])
    .map(t => t.name)
    .filter(name => allWorks.some(w => (w.tags || []).includes(name)));
  let activeTag = new URLSearchParams(location.search).get('tag');
  if (!usedTags.includes(activeTag)) activeTag = null;

  if (usedTags.length) {
    const bar = document.createElement('nav');
    bar.className = 'tag-filter';
    bar.setAttribute('aria-label', 'Filter works by tag');
    [null, ...usedTags].forEach(name => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = name || 'ALL';
      btn.dataset.tag = name || '';
      btn.addEventListener('click', () => applyFilter(name));
      bar.appendChild(btn);
    });
    grid.parentElement.insertBefore(bar, grid);
  }

  function applyFilter(name) {
    activeTag = name;
    works = name ? allWorks.filter(w => (w.tags || []).includes(name)) : allWorks;
    document.querySelectorAll('.tag-filter button').forEach(b => {
      const on = b.dataset.tag === (name || '');
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const url = new URL(location.href);
    if (name) url.searchParams.set('tag', name); else url.searchParams.delete('tag');
    history.replaceState(null, '', url);
    grid.innerHTML = '';
    offset = 0;
    loadMore();
  }

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

  applyFilter(activeTag);
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

  if (work.title) {
    const tit = document.createElement('div');
    tit.className = 'card-title';
    tit.textContent = work.title;
    card.appendChild(tit);
  }
  if (work.caption) {
    const cap = document.createElement('div');
    cap.className = 'card-caption';
    cap.textContent = work.caption;
    card.appendChild(cap);
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
  if (slug === 'about')   return renderAboutPage();
  if (slug === 'contact') return renderContactPage();

  const [pageData, tagsData, worksData, settings] = await Promise.all([
    fetchJSON(`/data/pages/${slug}.json`),
    fetchJSON('/data/tags.json'),
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  // SEO
  document.title = (pageData.seoTitle || pageData.title) + ' | YENPOPPY';
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
  document.title = (work.seoTitle || work.title) + ' | YENPOPPY';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && (work.seoDesc || work.description)) metaDesc.content = work.seoDesc || work.description;

  // èæ¯è²æ²¿ç¨å¨ç«
  if (settings.siteBg) document.body.style.background = settings.siteBg;

  const container = document.getElementById('page-content');
  if (!container) return;

  // Work detail header: back link + title + caption
  const header = document.createElement('div');
  header.className = 'work-header';
  const esc = v => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tools = Array.isArray(work.tools) ? work.tools.filter(Boolean).join(', ') : (work.tools || '');
  const meta = [work.year, work.client, tools].filter(Boolean).map(esc);
  const link = /^https?:\/\//.test(work.link || '') ? work.link : '';
  header.innerHTML = `
    <a class="work-header__back" href="/">← WORKS</a>
    <div class="work-header__titles">
      ${work.caption ? `<p class="work-header__caption">${esc(work.caption)}</p>` : ''}
      <h1 class="work-header__title">${esc(work.title)}</h1>
      ${meta.length ? `<p class="work-header__meta">${meta.join('<span aria-hidden="true">｜</span>')}</p>` : ''}
      ${work.description ? `<p class="work-header__desc">${esc(work.description)}</p>` : ''}
      ${link ? `<a class="work-header__link" href="${esc(link)}" target="_blank" rel="noopener">VIEW PROJECT ↗</a>` : ''}
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
  // Masonry columns: images keep their full aspect ratio (no cropping)
  grid.style.setProperty('--cols', cols);
  grid.style.setProperty('--gap', `${gutter}px`);
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
  if (path.startsWith('/quote')) {
    // 估價表是獨立頁面（quote/index.html），只套用頁首和導覽列
    await applySettings().catch(console.warn);
    await renderNav().catch(console.warn);
    initHamburger();
    return;
  }
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


// ─────────────────────────────────────────────
// ABOUT / CONTACT（資料在 data/about.json、data/contact.json，CMS 可改）
// ─────────────────────────────────────────────
const escHTML = v => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 只支援 [文字](網址)，其他照原文顯示
const inlineLinks = v => escHTML(v).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) =>
  /^(https?:\/\/|\/|#|mailto:)/.test(u) ? `<a href="${u}">${t}</a>` : m);

function setPageMeta(title, desc) {
  document.title = title + ' | YENPOPPY';
  const m = document.querySelector('meta[name="description"]');
  if (m && desc) m.content = desc;
}

async function renderAboutPage() {
  const d = await fetchJSON('/data/about.json');
  setPageMeta(d.seoTitle || 'ABOUT', d.seoDesc);
  const container = document.getElementById('page-content');
  const clients = (d.clients || []).filter(c => c && c.name);
  const stats = (d.stats || []).map(s => ({ ...s, value: s.value || (s.unit === '+' ? String(clients.length) : '') })).filter(s => s.value);

  const el = document.createElement('div');
  el.className = 'info-page about-page';
  el.innerHTML = `
    <section class="ab-hero">
      <p class="eyebrow">ABOUT</p>
      <h1 class="ab-hero__en">${escHTML(d.heroEn)}</h1>
      ${d.heroZh ? `<p class="ab-hero__zh">${escHTML(d.heroZh)}</p>` : ''}
    </section>

    <section class="ab-intro">
      ${d.introImage ? `<div class="ab-intro__img"><img src="${escHTML(fixImgUrl(d.introImage))}" alt="${escHTML(d.introImageAlt)}" loading="lazy"></div>` : ''}
      <div class="ab-intro__text">
        <p>${escHTML(d.intro)}</p>
        ${stats.length ? `<dl class="ab-stats">${stats.map(s => `
          <div><dt>${escHTML(s.value)}<small>${escHTML(s.unit)}</small></dt><dd>${escHTML(s.label)}</dd></div>`).join('')}
        </dl>` : ''}
      </div>
    </section>

    <section class="info-sec">
      <h2 class="info-h"><span>SERVICES</span>服務項目</h2>
      <div class="ab-services">${(d.services || []).map(s => `
        <div class="ab-service">
          <p class="ab-service__en">${escHTML(s.en)}</p>
          <h3>${escHTML(s.zh)}</h3>
          <p class="ab-service__desc">${escHTML(s.desc)}</p>
          <div class="ab-service__tags">${(s.tags || []).map(t =>
            `<a href="/?tag=${encodeURIComponent(t)}">${escHTML(t)}</a>`).join('')}</div>
        </div>`).join('')}
      </div>
    </section>

    ${clients.length ? `<section class="info-sec">
      <h2 class="info-h"><span>CLIENTS</span>合作品牌</h2>
      <ul class="ab-clients">${clients.map(c => `<li>${c.logo
        ? `<img src="${escHTML(fixImgUrl(c.logo))}" alt="${escHTML(c.name)}" loading="lazy">`
        : `<span>${escHTML(c.name)}</span>`}</li>`).join('')}
      </ul>
    </section>` : ''}

    <section class="info-sec">
      <h2 class="info-h"><span>PROCESS</span>設計方法</h2>
      <ol class="ab-process">${(d.process || []).map((p, i) => `
        <li><span class="no">0${i + 1}</span><p class="ab-process__en">${escHTML(p.en)}</p>
          <h3>${escHTML(p.zh)}</h3><p>${escHTML(p.desc)}</p></li>`).join('')}
      </ol>
    </section>

    <section class="info-cta">
      <h2>${escHTML(d.ctaTitle)}</h2>
      <div class="info-cta__btns">
        <a class="btn btn--primary" href="/pages/contact">${escHTML(d.ctaPrimary)}</a>
        <a class="btn" href="/">${escHTML(d.ctaSecondary)}</a>
      </div>
    </section>`;
  container.appendChild(el);

  // 結構化資料：讓搜尋引擎認得這是設計服務
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'YENPOPPY',
    url: location.origin + '/', description: d.seoDesc || d.intro, areaServed: 'TW',
    knowsAbout: (d.services || []).flatMap(s => [s.zh, ...(s.tags || [])]),
  });
  document.head.appendChild(ld);
}

async function renderContactPage() {
  const [d, settings, tagsData] = await Promise.all([
    fetchJSON('/data/contact.json'), fetchJSON('/data/settings.json'), fetchJSON('/data/tags.json'),
  ]);
  setPageMeta(d.seoTitle || 'CONTACT', d.seoDesc);
  const container = document.getElementById('page-content');
  const tags = (tagsData.tags || []).map(t => t.name).filter(Boolean);
  const email = d.email || '';

  const el = document.createElement('div');
  el.className = 'info-page contact-page';
  el.innerHTML = `
    <section class="ab-hero">
      <p class="eyebrow">CONTACT</p>
      <h1 class="ab-hero__zh ab-hero__zh--lg">${escHTML(d.title)}</h1>
    </section>

    <section class="ct-paths">${(d.paths || []).map(p => `
      <a class="ct-path" href="${escHTML(p.href)}">
        <h2>${escHTML(p.title)}</h2>
        <p>${escHTML(p.desc)}</p>
        <span class="ct-path__go">${escHTML(p.button)} →</span>
      </a>`).join('')}
    </section>

    <section class="info-sec" id="contact-form">
      <h2 class="info-h"><span>FORM</span>聯絡表單</h2>
      <form class="ct-form" novalidate>
        <p class="hp" aria-hidden="true"><label>請勿填寫 <input name="website" tabindex="-1" autocomplete="off"></label></p>
        <div class="f"><label for="cf-name">怎麼稱呼你</label><input id="cf-name" name="name" required maxlength="60" autocomplete="name"></div>
        <div class="f"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required maxlength="120" autocomplete="email"></div>
        <div class="f f--full"><span class="lbl" id="cf-svc-l">想做什麼 <small>可複選</small></span>
          <div class="ct-chips" role="group" aria-labelledby="cf-svc-l">${tags.map(t =>
            `<button type="button" aria-pressed="false" data-svc="${escHTML(t)}">${escHTML(t)}</button>`).join('')}</div>
          <p class="ct-err" id="cf-svc-err" hidden>請至少選一項</p></div>
        <div class="f"><label for="cf-budget">預算範圍 <small class="opt">選填</small></label>
          <select id="cf-budget" name="budget"><option value="">請選擇</option>${(d.budgets || []).map(b =>
            `<option>${escHTML(b)}</option>`).join('')}</select></div>
        <div class="f"><label for="cf-date">希望完成時間 <small class="opt">選填</small></label><input id="cf-date" name="date" type="date"></div>
        <div class="f f--full"><label for="cf-brand">公司／品牌名稱 <small class="opt">選填</small></label><input id="cf-brand" name="brand" maxlength="80" autocomplete="organization"></div>
        <div class="f f--full"><label for="cf-msg">想說的話 <small class="opt">選填</small></label><textarea id="cf-msg" name="message" rows="5" maxlength="2000" placeholder="品牌介紹、想做的內容、使用情境都可以寫"></textarea></div>
        <div class="f f--full"><label for="cf-link">參考資料連結 <small class="opt">選填</small></label><input id="cf-link" name="link" type="url" maxlength="300" placeholder="Google 雲端、Pinterest、品牌網站等"></div>
        <div class="f f--full"><button class="btn btn--primary" type="submit">送出</button></div>
      </form>
      <div class="ct-sent" hidden></div>
    </section>

    <section class="info-sec">
      <h2 class="info-h"><span>ELSEWHERE</span>其他聯絡方式</h2>
      <ul class="ct-links">
        ${email ? `<li><span class="k">EMAIL</span><a href="mailto:${escHTML(email)}">${escHTML(email)}</a><button type="button" class="ct-copy" data-copy="${escHTML(email)}">複製</button></li>` : ''}
        ${d.instagram ? `<li><span class="k">INSTAGRAM</span><a href="${escHTML(d.instagram)}" target="_blank" rel="noopener">${escHTML(d.instagram.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} ↗</a></li>` : ''}
        ${d.linkedin ? `<li><span class="k">LINKEDIN</span><a href="${escHTML(d.linkedin)}" target="_blank" rel="noopener">${escHTML(d.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} ↗</a></li>` : ''}
      </ul>
    </section>

    ${(d.faq || []).length ? `<section class="info-sec">
      <h2 class="info-h"><span>FAQ</span>常見問題</h2>
      <div class="ct-faq">${d.faq.map(f => `
        <details><summary>${escHTML(f.q)}</summary><p>${inlineLinks(f.a)}</p></details>`).join('')}
      </div>
    </section>` : ''}`;
  container.appendChild(el);

  const form = el.querySelector('.ct-form');
  const svcErr = el.querySelector('#cf-svc-err');
  el.querySelector('.ct-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-svc]'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    svcErr.hidden = true;
  });
  el.querySelectorAll('.ct-copy').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = '已複製'; }, () => {});
  }));
  el.querySelector('#cf-date').min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const services = [...form.querySelectorAll('[data-svc][aria-pressed="true"]')].map(b => b.dataset.svc);
    svcErr.hidden = services.length > 0;
    if (!form.reportValidity() || !services.length) return;
    if (form.website.value) return; // 機器人

    const data = {
      type: 'contact', name: form.name.value.trim(), email: form.email.value.trim(), services: services.join('、'),
      budget: form.budget.value, date: form.date.value, brand: form.brand.value.trim(),
      message: form.message.value.trim(), link: form.link.value.trim(),
    };
    const summary = [
      `稱呼：${data.name}`, `Email：${data.email}`, `想做什麼：${data.services}`,
      `預算範圍：${data.budget || '—'}`, `希望完成：${data.date || '—'}`, `公司／品牌：${data.brand || '—'}`,
      `參考連結：${data.link || '—'}`, '', data.message || '',
    ].join('\n');

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true; btn.textContent = '送出中⋯';
    let ok = false;
    if (settings.formEndpoint) {
      try {
        const res = await fetch(settings.formEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...data, summary }),
        });
        ok = res.ok && (await res.text()).trim().startsWith('ok');
      } catch (err) { ok = false; }
    }
    btn.disabled = false; btn.textContent = '送出';

    const box = el.querySelector('.ct-sent');
    box.hidden = false;
    if (ok) {
      form.hidden = true;
      box.innerHTML = `<h3>${escHTML(d.sentTitle)}</h3><p>${escHTML(d.sentText)}</p>`;
    } else {
      // 收件程式還沒設定或暫時失敗：改用 Email 寄出
      const mail = `mailto:${email}?subject=${encodeURIComponent('合作詢問：' + data.name)}&body=${encodeURIComponent(summary)}`;
      box.innerHTML = `<h3>改用 Email 寄出</h3><p>目前沒辦法直接送出，按下面的按鈕會打開 Email，內容已經幫你填好。</p>
        <a class="btn btn--primary" href="${escHTML(mail)}">用 Email 寄出</a>`;
    }
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

document.addEventListener('DOMContentLoaded', init);
