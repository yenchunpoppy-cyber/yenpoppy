/**
 * YEN POPPY — 前台核心 JS
 * 規格書 v1 完整對應
 */

'use strict';

// ─────────────────────────────────────────────
// 資料快取
// ─────────────────────────────────────────────
const Cache = {};

async function fetchJSON(path) {
  if (Cache[path]) return Cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`fetch ${path} → ${res.status}`);
  const data = await res.json();
  Cache[path] = data;
  return data;
}

// ─────────────────────────────────────────────
// 應用品牌設定
// ─────────────────────────────────────────────
async function applySettings() {
  const s = await fetchJSON('/data/settings.json');
  const root = document.documentElement;

  if (s.headerBg)  root.style.setProperty('--header-bg',   s.headerBg);
  if (s.siteBg)    root.style.setProperty('--site-bg',     s.siteBg);
  if (s.textColor) root.style.setProperty('--text-color',  s.textColor);

  // 字體
  const fontMap = {
    'poppins-extralight': "'Poppins', sans-serif",
    'noto-serif-tc':      "'Noto Serif TC', serif",
    'noto-sans-tc':       "'Noto Sans TC', sans-serif",
    'all-serif':          "'Noto Serif TC', serif",
  };
  if (s.titleFont) root.style.setProperty('--font-title', fontMap[s.titleFont] || fontMap['poppins-extralight']);
  if (s.bodyFont)  root.style.setProperty('--font-body',  fontMap[s.bodyFont]  || fontMap['poppins-extralight']);

  // 全站 gutter 預設
  if (s.worksGutter !== undefined) {
    root.style.setProperty('--gutter', s.worksGutter + 'px');
  }

  // Logo
  const header = document.getElementById('site-header');
  if (header) {
    const logoMark = header.querySelector('.logo-mark');
    const logoWordmark = header.querySelector('.logo-wordmark');
    if (logoMark && s.logoMark)     { logoMark.src = s.logoMark; logoMark.style.display = 'block'; }
    if (logoWordmark && s.logoWordmark) { logoWordmark.src = s.logoWordmark; logoWordmark.style.display = 'block'; }
  }

  // Favicon
  if (s.favicon) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = s.favicon;
  }

  // 裝飾花紋
  if (Array.isArray(s.decorations)) {
    renderDecorations(s.decorations);
  }

  return s;
}

// ─────────────────────────────────────────────
// 裝飾花紋（固定視窗角落）
// ─────────────────────────────────────────────
function renderDecorations(decorations) {
  const isMobile = window.innerWidth < 600;
  decorations.forEach((d, i) => {
    if (!d.image) return;
    if (d.mobileHide && isMobile) return;

    const el = document.createElement('div');
    el.className = `deco-pattern deco-${d.position || 'tr'} deco-${d.size || 'medium'}`;
    el.setAttribute('aria-hidden', 'true');

    const img = document.createElement('img');
    img.src = d.image;
    img.alt = '';
    el.appendChild(img);
    document.body.appendChild(el);
  });
}

// ─────────────────────────────────────────────
// 導覽列
// ─────────────────────────────────────────────
async function renderNav() {
  const data = await fetchJSON('/data/nav.json');
  const nav = document.getElementById('site-nav');
  const mobileNav = document.getElementById('mobile-nav');
  if (!nav) return;

  const currentSlug = getCurrentSlug();
  const currentPage = document.body.dataset.page; // 'works' | 'page' | 'work'

  data.items.forEach(item => {
    const href = item.type === 'works' ? '/' : `/page/${item.page}`;
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

// 漢堡選單
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    if (open) {
      mobileNav.classList.add('open');
      // 鍵盤焦點鎖定在面板內（規格書 §5.5）
      mobileNav.setAttribute('tabindex', '-1');
      mobileNav.focus();
    } else {
      closeMobileNav();
    }
  });

  // Esc 關閉（規格書 §5.5）
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

// ─────────────────────────────────────────────
// URL 工具
// ─────────────────────────────────────────────
function getCurrentSlug() {
  // /page/social-media → 'social-media'
  // /work/et-seq-nail  → 'et-seq-nail'
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[1] || '';
}

// ─────────────────────────────────────────────
// WORKS 網格頁
// ─────────────────────────────────────────────
const WORKS_PAGE_SIZE = 24;

async function renderWorksGrid() {
  const [worksData, settings] = await Promise.all([
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  // 首頁背景色
  const homeBg = worksData.homeBg || settings.homeBg || settings.siteBg;
  if (homeBg) document.body.style.background = homeBg;

  // SEO title
  document.title = 'WORKS | YEN POPPY';

  const grid = document.getElementById('works-grid');
  if (!grid) return;

  const cols   = parseInt(worksData.homeColumns || '3', 10);
  const gutter = parseInt(worksData.homeGutter  || '12', 10);

  // 計算外邊界（gutter × 2，gutter=0時外邊界也=0）
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

    // 移除舊哨兵
    const old = document.getElementById('scroll-sentinel');
    if (old) old.remove();

    // 若還有更多，新增哨兵觸發 infinite scroll
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
    img.src = work.thumbnail;
    img.alt = imgAlt;
    img.loading = 'lazy';
    // 保留長寬比避免版面跳動
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

  const navigate = () => { location.href = `/work/${work.id}`; };
  card.addEventListener('click', navigate);
  card.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(); });

  return card;
}

// ─────────────────────────────────────────────
// 模塊頁渲染（page.html）
// ─────────────────────────────────────────────
async function renderModulePage() {
  const slug = getCurrentSlug();
  if (!slug) return;

  const [pageData, worksData, settings] = await Promise.all([
    fetchJSON(`/data/pages/${slug}.json`),
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  // SEO
  document.title = (pageData.seoTitle || pageData.title) + ' | YEN POPPY';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && (pageData.seoDesc || pageData.title)) {
    metaDesc.content = pageData.seoDesc || pageData.title;
  }

  // 頁面背景色
  const bg = pageData.bg || settings.siteBg;
  if (bg) document.body.style.background = bg;

  const container = document.getElementById('page-content');
  if (!container) return;

  (pageData.modules || []).forEach(mod => {
    const el = renderModule(mod, settings, pageData.bg);
    if (el) container.appendChild(el);
  });
}

// ─────────────────────────────────────────────
// 作品內頁渲染（work.html）
// ─────────────────────────────────────────────
async function renderWorkPage() {
  const slug = getCurrentSlug();
  if (!slug) return;

  const [worksData, settings] = await Promise.all([
    fetchJSON('/data/works.json'),
    fetchJSON('/data/settings.json'),
  ]);

  const work = (worksData.works || []).find(w => w.id === slug);
  if (!work) {
    document.getElementById('page-content').textContent = '找不到此作品';
    return;
  }

  // SEO
  document.title = (work.seoTitle || work.title) + ' | YEN POPPY';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && work.seoDesc) metaDesc.content = work.seoDesc;

  // 背景色沿用全站
  if (settings.siteBg) document.body.style.background = settings.siteBg;

  const container = document.getElementById('page-content');
  if (!container) return;

  (work.modules || []).forEach(mod => {
    const el = renderModule(mod, settings, '');
    if (el) container.appendChild(el);
  });
}

// ─────────────────────────────────────────────
// 通用：渲染一個模塊
// ─────────────────────────────────────────────
function renderModule(mod, settings, pageBg) {
  if (!mod || !mod.type) return null;
  if (mod.type === 'module_a') return renderModuleA(mod, settings, pageBg);
  if (mod.type === 'module_b') return renderModuleB(mod, settings, pageBg);
  return null;
}

// ── 模塊 A ──
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

  // 標題 + 豎線
  const hasHeadline = !!(mod.headline || (mod.body && mod.body.trim()));
  if (hasHeadline) {
    const header = document.createElement('div');
    header.className = 'module-a__header';

    // 豎線（有標題才加）
    if (mod.headline) {
      const decoLine = document.createElement('div');
      decoLine.className = 'module-a__deco-line';
      // 高度靠 flexbox 自動撐到 header 高度
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

    // 豎線高度對齊：headline 頂到 body 底（用 flexbox align-stretch 自然達成）
    const decoLineEl = header.querySelector('.module-a__deco-line');
    if (decoLineEl) decoLineEl.style.alignSelf = 'stretch';
  }

  // 純文字對齊（cols=0）
  if (cols === '0') {
    const align = mod.textAlign || 'left';
    section.classList.add(`module-a--text-${align}`);
  }

  // 圖片區
  const images = mod.images || [];
  if (images.length && cols !== '0') {
    if (isFullWidth) {
      // 滿版：一張或多張直接全寬
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
      const isCrop  = numCols >= 2; // 兩欄/三欄裁切

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

// 在 imgWrap 內建圖片 + 疊字
function appendImg(imgWrap, imgData, fallbackAlt) {
  if (!imgData.src) return;

  const img = document.createElement('img');
  img.src = imgData.src;
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

// ── 模塊 B ──
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
      img.src     = imgData.src;
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

// ─────────────────────────────────────────────
// 工具：解析 gutter
// ─────────────────────────────────────────────
function resolveGutter(modGutter, settings) {
  if (!modGutter || modGutter === 'default') {
    return parseInt(settings?.worksGutter || '12', 10);
  }
  return parseInt(modGutter, 10);
}

// ─────────────────────────────────────────────
// 最小 Markdown → HTML（粗體/斜體/連結）
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────────
async function init() {
  const page = document.body.dataset.page;

  // 先套設定（logo、色票、花紋），再算版面
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
