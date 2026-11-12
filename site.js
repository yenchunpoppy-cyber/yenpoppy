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
      return new TextDecoder('utf-8', { fatal: true }).decode(b);  // 不是亂碼（例如 ×）就保留原字
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
  if (path.endsWith('/works.json') && Array.isArray(data.works)) data.works = data.works.filter(w => !w.hidden);  // 勾「隱藏」的作品不出現在網站
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
    if (item.zh) {
      a.innerHTML = `<span class="nv-zh">${escHTML(item.zh)}</span><span class="nv-en">${escHTML(item.label)}</span>`;
    } else a.textContent = item.label;
    if (isActive) a.classList.add('active');

    nav.appendChild(a.cloneNode(true));
    if (mobileNav) {
      const ma = a.cloneNode(true);
      ma.addEventListener('click', closeMobileNav);
      mobileNav.appendChild(ma);
    }
  });
  // 手機選單下方：行動按鈕＋聯絡方式
  if (mobileNav && !mobileNav.querySelector('.mn-foot')) {
    const c = await fetchJSON('/data/contact.json').catch(() => ({}));
    const foot = document.createElement('div');
    foot.className = 'mn-foot';
    foot.innerHTML = `<p class="mn-links">${c.email ? `<a href="mailto:${escHTML(c.email)}">${escHTML(c.email)}</a>` : ''}${c.instagram ? `<a href="${escHTML(c.instagram)}" target="_blank" rel="noopener">Instagram ↗</a>` : ''}</p>`;
    foot.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));
    mobileNav.appendChild(foot);
  }
}

// æ¼¢å ¡é¸å®
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    if (open) {
      const hd = document.getElementById('site-header');
      if (hd) mobileNav.style.setProperty('--mn-top', Math.round(hd.getBoundingClientRect().bottom) + 'px');
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
  document.title = 'YENPOPPY｜台灣品牌識別、包裝與數位設計';

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
  await renderHomeIntro(grid, allWorks).catch(console.warn);
  // 精選：放在作品牆最前面、兩格寬（只在 ALL 時）
  const homeData = await fetchJSON('/data/home.json').catch(() => ({}));
  const featIds = [];  // 2026-11-11：不再另外放主打區，主打作品直接排在列表最前面（works.json 順序）
  let featRow = null;
  if (featIds.length) {
    featRow = document.createElement('div');
    featRow.className = 'feat-row';
    featIds.forEach(id => featRow.appendChild(createWorkCard(allWorks.find(w => w.id === id))));
    grid.parentElement.insertBefore(featRow, grid);
  }
  const tagsData = await fetchJSON('/data/tags.json').catch(() => ({ tags: [] }));
  let works = allWorks;
  let offset = 0;

  // 篩選列：ALL ＋ 四項服務（對應規則來自 About 服務卡的 tags；作品可用 services 欄位單獨指定）
  const aboutData = await fetchJSON('/data/about.json').catch(() => ({}));
  const svcMap = serviceMap(aboutData);
  const usedSvc = SERVICE_KEYS.filter(k => allWorks.some(w => workServices(w, svcMap).includes(k)));
  const qs = new URLSearchParams(location.search);
  let activeTag = (qs.get('service') || '').toUpperCase() || null;
  if (!activeTag && qs.get('tag')) activeTag = svcMap[qs.get('tag')] || null;  // 舊連結 ?tag= 相容
  if (!usedSvc.includes(activeTag)) activeTag = null;

  if (usedSvc.length) {
    const bar = document.createElement('nav');
    bar.className = 'tag-filter';
    bar.setAttribute('aria-label', 'Filter works by service');
    [null, ...usedSvc].forEach(name => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = name || 'ALL';
      if (SERVICE_ZH[name]) { const z = document.createElement('span'); z.className = 'tf-zh'; z.textContent = SERVICE_ZH[name]; btn.appendChild(z); }
      btn.dataset.tag = name || '';
      btn.addEventListener('click', () => applyFilter(name));
      bar.appendChild(btn);
    });
    const lbl = document.createElement('p');
    lbl.className = 'tf-label';
    lbl.textContent = '依類別篩選';
    // 手機：一排一件／一排兩件 切換（記住選擇）
    const head = document.createElement('div');
    head.className = 'tf-head';
    head.appendChild(lbl);
    const vt = document.createElement('div');
    vt.className = 'view-toggle';
    vt.setAttribute('role', 'group');
    vt.setAttribute('aria-label', '作品排列方式');
    const ICON = {
      '1': '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
      '2': '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="1.5" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="1.5" y="9" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="9" width="5.5" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'
    };
    let view = '1';
    try { view = localStorage.getItem('yp-view') === '2' ? '2' : '1'; } catch (e) {}
    const setView = v => {
      view = v;
      grid.dataset.view = v;
      vt.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v ? 'true' : 'false'));
      try { localStorage.setItem('yp-view', v); } catch (e) {}
    };
    ['1', '2'].forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = v;
      b.setAttribute('aria-label', v === '1' ? '一排一件' : '一排兩件');
      b.innerHTML = ICON[v];
      b.addEventListener('click', () => setView(v));
      vt.appendChild(b);
    });
    head.appendChild(vt);
    setView(view);
    grid.parentElement.insertBefore(head, grid);
    grid.parentElement.insertBefore(bar, grid);
  }

  function applyFilter(name) {
    activeTag = name;
    works = name ? allWorks.filter(w => workServices(w, svcMap).includes(name)) : allWorks.filter(w => !featIds.includes(w.id));
    if (featRow) featRow.hidden = !!name;
    document.querySelectorAll('.tag-filter button').forEach(b => {
      const on = b.dataset.tag === (name || '');
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const url = new URL(location.href);
    url.searchParams.delete('tag');
    if (name) url.searchParams.set('service', name.toLowerCase()); else url.searchParams.delete('service');
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
  if (activeTag) document.getElementById('index')?.scrollIntoView();
}

// 四項服務：順序和 About 服務卡相同
const SERVICE_KEYS = ['BRAND', 'PACKAGING', 'DIGITAL', 'DISPLAY'];
const SERVICE_ZH = { BRAND: '品牌', PACKAGING: '包裝', DIGITAL: '數位', DISPLAY: '展示' };
function serviceMap(about) {
  const m = {};
  (about.services || []).forEach((s, i) => (s.tags || []).forEach(t => { if (SERVICE_KEYS[i]) m[t] = SERVICE_KEYS[i]; }));
  return m;
}
function workServices(w, map) {
  if ((w.services || []).length) return w.services;
  return [...new Set((w.tags || []).map(t => map[t]).filter(Boolean))];
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
  const capText = work.subtitle || work.caption;  // 中文副標「是什麼｜做了什麼」，沒填就用英文圖說
  if (capText) {
    const cap = document.createElement('div');
    cap.className = 'card-caption';
    const parts = String(capText).split('｜');
    if (parts.length > 1) {  // 手機只顯示「做了什麼」，桌機顯示全部
      const a = document.createElement('span'); a.className = 'cap-a'; a.textContent = parts[0] + '｜';
      const b = document.createElement('span'); b.className = 'cap-b'; b.textContent = parts.slice(1).join('｜');
      cap.append(a, b);
    } else cap.textContent = capText;
    card.appendChild(cap);
  }
  if ((work.tags || []).length) {
    const tg = document.createElement('div');
    tg.className = 'card-tags';
    tg.textContent = work.tags.map(t => `[ ${t} ]`).join(' ');
    card.appendChild(tg);
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
  const all = worksData.works || [];
  const idx = all.findIndex(w => w.id === work.id);
  const pad = n => String(n).padStart(2, '0');
  const home = await fetchJSON('/data/home.json').catch(() => ({}));
  const sel = (home.selected || []).find(x => x.id === work.id);
  const tagLine = (work.tags || []).map(t => `<a href="/?tag=${encodeURIComponent(t)}#index">[ ${esc(t)} ]</a>`).join(' ');
  header.className = 'work-header work-header--hero';
  // 作品資訊小字清單：客戶／合作團隊／年份／網站（有填才顯示）
  const metaRows = [
    ['CLIENT', work.client], ['AGENCY', work.agency], ['YEAR', work.year],
  ].filter(r => r[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`);
  if (link) metaRows.push(`<div><dt>WEBSITE</dt><dd><a href="${esc(link)}" target="_blank" rel="noopener">${esc(link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} ↗</a></dd></div>`);
  header.innerHTML = pageHead({
    en: `<a href="/#index">← 所有作品</a>`,
    title: work.title,
    lead: work.subtitle || work.caption || '',
  });
  container.appendChild(header);

  // 閱讀順序：標題副標 → 主圖 → 概念文字 → 作品圖 → 專案資訊（客戶／合作團隊／年份／網站）
  const mods = (work.modules || []).slice();
  const first = mods[0];
  if (first && first.type === 'module_a' && (first.images || []).length && (first.body || '').trim()) {
    mods.splice(0, 1,
      { type: 'module_b', columns: '1', gutter: 'default', bg: '', images: first.images, isHero: true },
      Object.assign({}, first, { images: [], columns: '0' }));
  }
  mods.forEach(mod => {
    const el = renderModule(mod, settings, '');
    if (el) { if (mod.isHero) el.classList.add('wk-hero'); container.appendChild(el); }
  });
  if (metaRows.length) {
    const info = document.createElement('section');
    info.className = 'module-wrap wk-info';
    info.innerHTML = `<dl class="wk-meta">${metaRows.join('')}</dl>`;
    container.appendChild(info);
  }

  // 上一件／下一件
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const pager = document.createElement('nav');
  pager.className = 'work-pager';
  pager.setAttribute('aria-label', '其他作品');
  pager.innerHTML = `
    <a class="work-pager__prev" href="/works/${encodeURIComponent(prev.id)}"><span class="micro">← 上一件</span><b>${esc(prev.title)}</b></a>
    <a class="work-pager__all" href="/#index"><span class="micro">所有作品</span><b>${pad(idx + 1)} / ${pad(all.length)}</b></a>
    <a class="work-pager__next" href="/works/${encodeURIComponent(next.id)}"><span class="micro">下一件 →</span><b>${esc(next.title)}</b></a>`;
  container.appendChild(pager);
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
  if (mod.narrow) wrap.classList.add(mod.narrow === 'phone' ? 'is-phone' : 'is-narrow');  // 長條圖（整頁長圖、切片網頁）縮窄置中，避免頁面過長

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
// 圖片或影片（.mp4/.webm 會自動播放、靜音、循環）
function mediaEl(imgData) {
  if (imgData.youtube) {
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(imgData.youtube) + '?rel=0';
    f.title = imgData.alt || 'video';
    f.loading = 'lazy';
    f.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.className = 'yt-embed';
    return f;
  }
  if (/\.(mp4|webm)(\?|$)/i.test(imgData.src)) {
    const v = document.createElement('video');
    v.src = fixImgUrl(imgData.src);
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'metadata';
    if (imgData.poster) v.poster = fixImgUrl(imgData.poster);
    if (imgData.alt) v.setAttribute('aria-label', imgData.alt);
    return v;
  }
  const img = document.createElement('img');
  img.src = fixImgUrl(imgData.src);
  img.alt = imgData.alt || '';
  img.loading = 'lazy';
  return img;
}

function appendImg(imgWrap, imgData, fallbackAlt) {
  if (!imgData.src && !imgData.youtube) return;

  const img = mediaEl({ ...imgData, alt: imgData.alt || fallbackAlt || '' });
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
  if (mod.narrow) wrap.classList.add(mod.narrow === 'phone' ? 'is-phone' : 'is-narrow');  // 長條圖（整頁長圖、切片網頁）縮窄置中，避免頁面過長

  const section = document.createElement('section');
  section.className = 'module-b';
  if (mod.bg) section.style.background = mod.bg;

  const cols    = parseInt(mod.columns || '3', 10);
  const gutter  = resolveGutter(mod.gutter, settings);
  const images  = mod.images || [];

  // 合併作品的段落小標（例：包裝設計／社群貼文）
  if (mod.headline) {
    const lb = document.createElement('h2');
    lb.className = 'module-b__label';
    lb.textContent = mod.headline;
    section.appendChild(lb);
  }

  const grid = document.createElement('div');
  grid.className = 'module-b__grid';
  // Masonry columns: images keep their full aspect ratio (no cropping)
  grid.style.setProperty('--cols', cols);
  grid.style.setProperty('--gap', `${gutter}px`);
  grid.dataset.cols = cols;
  grid.dataset.gap = gutter;
  if (mod.rows) grid.classList.add('is-rows');  // 依列排序（相簿跨頁要照頁序）
  if (mod.crop) grid.classList.add('is-crop');  // 同列照片裁成一致比例，高度對齊
  if (mod.justify) grid.classList.add('is-justify');
  if (mod.justify && !mod.headline) wrap.classList.add('is-cont');  // 接續上一段的同組圖，間距縮小  // 同列等高、不裁切：寬度依圖片比例分配（圖需有 r＝寬/高）

  images.forEach(imgData => {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'img-wrap';
    if (mod.justify && imgData.r) imgWrap.style.flex = `${imgData.r} 1 0`;
    if (imgData.src || imgData.youtube) {
      imgWrap.appendChild(mediaEl(imgData));
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
    await renderQuoteExtras().catch(console.warn);
    await renderFooter().catch(console.warn);
    return;
  }
  // 舊的聯絡頁已併入合作洽詢
  if (path.startsWith('/pages/contact')) { location.replace('/quote/' + location.hash); return; }
  if (path.startsWith('/works/')) document.body.dataset.page = 'work';
  else if (path.startsWith('/pages/')) document.body.dataset.page = 'page';
  else document.body.dataset.page = 'works';
  const page = document.body.dataset.page;

  // åå¥è¨­å®ï¼logoãè²ç¥¨ãè±ç´ï¼ï¼åç®çé¢
  await applySettings().catch(console.warn);
  await renderNav().catch(console.warn);
  initHamburger();

  renderRails();
  if (page === 'works') {
    await renderWorksGrid().catch(console.error);
  } else if (page === 'page') {
    await renderModulePage().catch(console.error);
  } else if (page === 'work') {
    await renderWorkPage().catch(console.error);
  }
  await renderFooter().catch(console.warn);
  initReveal();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
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
  const [d, worksData] = await Promise.all([fetchJSON('/data/about.json'), fetchJSON('/data/works.json')]);
  setPageMeta(d.seoTitle || 'ABOUT', d.seoDesc);
  const container = document.getElementById('page-content');
  const works = worksData.works || [];
  const byId = id => works.find(w => w.id === id);
  const countTag = t => works.filter(w => (w.tags || []).includes(t)).length;
  const stats = (d.stats || []).filter(s => s.value);
  const awards = (d.awards || []).filter(a => a.title);
  const brands = (d.brands || []).filter(c => c && c.name);
  const paras = String(d.intro || '').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
  const pad2 = i => String(i + 1).padStart(2, '0');

  const el = document.createElement('div');
  el.className = 'info-page about-page ab2';
  const head = (label, zh, title, desc) => `
      <header class="ab2-head">
        <p class="ab2-eyebrow">${escHTML(zh || label)}</p>
        ${title && title !== zh ? `<h2 class="ab2-h2">${clauses(escHTML(title).replace(/\*(.+?)\*/g, '<mark>$1</mark>'))}</h2>` : ''}
        ${desc ? `<p class="ab2-lead">${escHTML(desc)}</p>` : ''}
      </header>`;
  const svcMap = serviceMap(d);
  const svcCount = k => works.filter(w => workServices(w, svcMap).includes(k)).length;
  el.innerHTML = `
    ${pageHead({ en: 'ABOUT', title: d.motto || '關於我' })}

    <section class="ab2-sec ab2-profile">
      <div class="ab2-profile__grid">
        ${d.introImage ? `<div class="ab2-profile__img"><img src="${escHTML(fixImgUrl(d.introImage))}" alt="${escHTML(d.introImageAlt)}" loading="lazy"></div>` : '<div></div>'}
        <div class="ab2-profile__text">
          <div class="ab2-body">${paras.map(t => `<p>${escHTML(t).replace(/\*(.+?)\*/g, '<mark>$1</mark>').replace(/\n/g, '<br class="ab2-br">')}</p>`).join('')}</div>
          ${stats.length ? `<dl class="ab2-facts">
            ${stats.map(s => `<div class="ab2-fact--big"><dd><b>${escHTML(s.value)}</b>${s.unit ? `<span>${escHTML(s.unit)}</span>` : ''}</dd><dt>${escHTML(s.label)}</dt></div>`).join('')}
          </dl>` : ''}
        </div>
      </div>
      ${d.introQuote ? `<blockquote class="ab2-quote"><p>${escHTML(d.introQuote)}</p></blockquote>` : ''}
    </section>

    <section class="ab2-sec">
      ${head('DESIGN CAPABILITIES', '設計能力', d.servicesTitle, d.servicesDesc)}
      <div class="ab2-cards">${(d.services || []).map((s, i) => {
        const key = SERVICE_KEYS[i];
        const n = key ? svcCount(key) : 0;
        return `
        <article class="ab2-card">
          <div class="ab2-card__top"><span class="ab2-big">${pad2(i)}</span>
            ${s.icon ? `<img src="${escHTML(fixImgUrl(s.icon))}" alt="" aria-hidden="true">` : ''}</div>
          <h3 class="ab2-h3">${escHTML(s.zh)}</h3>
          <p class="ab2-desc">${escHTML(s.desc)}</p>
          ${(s.items || []).length ? `<ul class="ab2-items">${s.items.map(t => `<li>${escHTML(t)}</li>`).join('')}</ul>` : ''}
          ${n ? `<a class="ab2-btn-line ab2-card__btn" href="/?service=${key.toLowerCase()}#index">相關作品 ${n} 件 →</a>` : ''}
        </article>`;
      }).join('')}
      </div>
    </section>

    ${brands.length ? `<section class="ab2-sec">
      ${head('BRANDS &amp; PROJECTS', '參與品牌與專案', d.brandsTitle, d.brandsDesc)}
      ${(d.brandsIndustries || []).length ? `<ul class="ab2-ind" aria-label="合作產業">${d.brandsIndustries.map(t => `<li><mark>${escHTML(t)}</mark></li>`).join('')}</ul>` : ''}
      <div class="ab2-marquee"><ul class="ab2-logos">${brands.map(c => {
        const w = byId(c.work);
        const z = c.scale ? ` style="--z:${Number(c.scale) || 1}"` : '';
        const img = c.logo ? `<span class="lg"><img src="${escHTML(fixImgUrl(c.logo))}" alt="${escHTML(c.name)}" title="${escHTML(c.name)}" loading="lazy"${z}>${c.logoColor ? `<img class="lg-c" src="${escHTML(fixImgUrl(c.logoColor))}" alt="" aria-hidden="true" loading="lazy">` : ''}</span>` : `<b>${escHTML(c.name)}</b>`;
        return `<li>${w ? `<a href="/works/${encodeURIComponent(w.id)}" aria-label="${escHTML(c.name)}：${escHTML(w.title)}">${img}</a>` : img}</li>`;
      }).join('')}
      </ul></div>
      ${d.brandsNote ? `<p class="ab2-caption">${escHTML(d.brandsNote)}</p>` : ''}
    </section>` : ''}

    ${(d.journey || []).length || awards.length ? `<section class="ab2-sec">
      ${head('EXPERIENCE &amp; RECOGNITION', '經歷與肯定', d.journeyTitle, d.journeyDesc)}
      <ol class="ab2-chrono">${(d.journey || []).map((p, i) => {
        const ws = (p.works || []).map(byId).filter(Boolean);
        return `
        <li>
          <div class="ab2-chrono__when">${p.year ? `<b>${escHTML(p.year)}</b>` : `<b class="is-no">${pad2(i)}</b>`}<span>${escHTML(p.period || '')}</span></div>
          <div class="ab2-chrono__what">
            ${(p.org || p.en) ? `<p class="ab2-en">${escHTML(p.org || p.en)}</p>` : ''}
            <h3 class="ab2-h3">${escHTML(p.zh)}</h3>
            <p class="ab2-desc">${escHTML(p.desc)}</p>
          </div>
        </li>`;
      }).join('')}
      </ol>
      ${awards.map(a => {
        const w = byId(a.link);
        const yr = (a.title.match(/^\d{4}/) || [''])[0];
        return `<div class="ab2-award${a.image ? ' has-img' : ''}">
          ${a.image ? `<img class="ab2-award__img" src="${escHTML(fixImgUrl(a.image))}" alt="${escHTML(a.title)} 獎座" loading="lazy">` : ''}
          <div class="ab2-award__body"><p class="ab2-eyebrow">獲獎</p>
            <p class="ab2-award__yr">${escHTML(yr)}</p><h3 class="ab2-h3"><mark>${escHTML(a.title.replace(/^\d{4}\s*/, ''))}</mark></h3>
            ${a.work ? `<p class="ab2-desc">${escHTML(a.work)}</p>` : ''}
            ${w ? `<a class="ab2-btn-line" href="/works/${encodeURIComponent(w.id)}">看作品 →</a>` : ''}</div></div>`;
      }).join('')}
    </section>` : ''}`;
  // logo 視覺平衡：依長寬比調高度，讓每個 logo 面積接近（寬的矮一點、方的高一點）
  el.querySelectorAll('.ab2-logos img').forEach(img => {
    const fit = () => { if (img.naturalHeight) img.style.setProperty('--s', (1 / Math.sqrt(img.naturalWidth / img.naturalHeight)).toFixed(3)); };
    img.complete ? fit() : img.addEventListener('load', fit);
  });
  container.appendChild(el);

  // 結構化資料：讓搜尋引擎認得這是設計服務
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'YENPOPPY',
    url: location.origin + '/', description: d.seoDesc || d.intro, areaServed: 'TW',
    knowsAbout: (d.services || []).flatMap(s => [s.zh, ...(s.tags || [])]),
    award: awards.map(a => a.title),
  });
  document.head.appendChild(ld);
}

async function renderContactPage() {
  const [d, settings, tagsData, about] = await Promise.all([
    fetchJSON('/data/contact.json'), fetchJSON('/data/settings.json'), fetchJSON('/data/tags.json'),
    fetchJSON('/data/about.json').catch(() => ({})),
  ]);
  setPageMeta(d.seoTitle || 'CONTACT', d.seoDesc);
  const container = document.getElementById('page-content');
  const email = d.email || '';
  const pad2 = i => String(i + 1).padStart(2, '0');

  const el = document.createElement('div');
  el.className = 'info-page contact-page ab2';
  const svcs = ['品牌識別 & 視覺設計', '包裝 & 產品設計', '網站 & 數位設計', '展示陳列 & 展覽設計', '還不確定'];
  const head = (label, zh, title, desc) => `<header class="ab2-head"><p class="ab2-eyebrow">${escHTML(zh)}</p>
        ${title ? `<h2 class="ab2-h2">${escHTML(title)}</h2>` : ''}${desc ? `<p class="ab2-lead">${escHTML(desc)}</p>` : ''}</header>`;
  el.innerHTML = `
    ${pageHead({ en: 'CONTACT', title: '聯絡我', lead: '填好下面的表單，我會在確認內容後回覆你。', extra: `<p class="pg-head__mail">還不確定預算？可以先用<a href="/quote/">費用估算</a>看看大概的價格和時間。${email ? `<br>也可以直接寫信：<a href="mailto:${escHTML(email)}">${escHTML(email)}</a>` : ''}</p>` })}


    <section class="ab2-sec ct-sec" id="contact-form">
      <form class="ct-form" novalidate>
        <p class="hp" aria-hidden="true"><label>請勿填寫 <input name="website" tabindex="-1" autocomplete="off"></label></p>
        <div class="f"><label for="cf-name">怎麼稱呼你</label><input id="cf-name" name="name" required maxlength="60" autocomplete="name"></div>
        <div class="f"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required maxlength="120" autocomplete="email"></div>
        <div class="f f--full"><span class="lbl" id="cf-svc-l">想做什麼 <small>可複選</small></span>
          <div class="ct-chips" role="group" aria-labelledby="cf-svc-l">${svcs.map(t =>
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

    <section class="ab2-sec ct-sec">
      ${head('HOW I WORK', '合作流程', '', '')}
      <ol class="ab2-steps">${(about.process || []).map((p, i, arr) => `
        <li style="--p:${(i + 1) / arr.length}"><div class="ab2-steps__top"><span class="ab2-big">${pad2(i)}</span>${i < arr.length - 1 ? '<span class="ab2-steps__arrow" aria-hidden="true">→</span>' : ''}</div>
          <span class="ab2-steps__bar" aria-hidden="true"></span>
          <h3 class="ab2-h3">${escHTML(p.zh)}</h3><p class="ab2-desc">${escHTML(p.desc)}</p></li>`).join('')}
      </ol>
    </section>

    ${(d.faq || []).length ? `<section class="ab2-sec ct-sec">
      ${head('FAQ', '常見問題', '', '')}
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


// ─────────────────────────────────────────────
// 首頁開場＋精選作品（資料在 data/home.json，CMS 可改）
// ─────────────────────────────────────────────
async function renderHomeIntro(grid, works) {
  const d = await fetchJSON('/data/home.json');
  const byId = id => works.find(w => w.id === id);
  const img = w => w && w.thumbnail ? escHTML(fixImgUrl(w.thumbnail)) : '';
  const heroWorks = (d.heroImages || []).map(byId).filter(Boolean);
  const selected = (d.selected || []).map(s => ({ ...s, w: byId(s.id) })).filter(s => s.w);

  const wrap = document.createElement('div');
  wrap.className = 'home-intro';
  wrap.innerHTML = `
    ${!(d.heroIntro || []).length && !d.heroTitle ? '<h1 class="sr-only">YENPOPPY 作品</h1>' : ''}<section class="hm2"${!(d.heroIntro || []).length && !d.heroTitle ? ' hidden' : ''}>
      <h1 class="hm2__title hm2__title--line">${(d.heroIntro || []).slice(0, 1).map(t => `<span class="hm2__zh">${escHTML(t)}</span>`).join('')}${d.heroTitle ? `<span class="hm2__en">${escHTML(d.heroTitle)}</span>` : ''}</h1>
      ${d.heroSub ? `<p class="hm2__sub">${escHTML(d.heroSub)}</p>` : ''}
      ${d.heroLink && d.heroLink.text ? `<a class="hm2__link" href="${escHTML(d.heroLink.href || '/quote/')}">${escHTML(d.heroLink.text)}</a>` : ''}
    </section>
    <div id="index" class="hm2-anchor"></div>`;
  grid.parentElement.insertBefore(wrap, grid);
}

// 句尾最後幾個字不要單獨掉到下一行（例：「設計師。」）
function keepTail(t, n = 4) {
  const s = String(t || '');
  if (s.length <= n * 2) return escHTML(s);
  return `${escHTML(s.slice(0, -n))}<span class="nobr">${escHTML(s.slice(-n))}</span>`;
}

// ─────────────────────────────────────────────
// 輕量動態：捲動淡入、兩側直排小字
// ─────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal, .info-sec, .ab-intro, .work-card');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
  // 之後才載入的作品卡也要觀察
  const grid = document.getElementById('works-grid');
  if (grid) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1 && n.classList.contains('work-card')) io.observe(n);
  }))).observe(grid, { childList: true });
}

function renderRails() {
  return; // 2026-11-11 精簡：拿掉兩側直排字
  if (document.querySelector('.rail')) return;
  const l = document.createElement('div');
  l.className = 'rail rail--l'; l.setAttribute('aria-hidden', 'true');
  l.innerHTML = '<span>YENPOPPY — INDEPENDENT CREATIVE DESIGN STUDIO</span>';
  const r = document.createElement('div');
  r.className = 'rail rail--r'; r.setAttribute('aria-hidden', 'true');
  r.innerHTML = '<span>TAIWAN — ( 2013—2026 )</span>';
  document.body.append(l, r);
}


// 每一頁共用的開場（和首頁同一套編排）
function pageHero({ title, sub, line, info = [], meta = '', small = false }) {
  return `
    <section class="hm-hero hm-hero--page${small ? ' hm-hero--small' : ''}">
      <div class="hm-hero__text">
        <h1 class="hm-hero__title">${escHTML(title)}</h1>
        ${sub ? `<p class="hm-hero__sub">${escHTML(sub)}</p>` : ''}
        ${line ? `<p class="hm-hero__note">${escHTML(line)}</p>` : ''}
      </div>
      ${info.length ? `<p class="hm-hero__info">${info.join('<br>')}</p>` : ''}
      ${meta ? `<p class="hm-hero__meta micro">${meta}</p>` : ''}
    </section>`;
}


// ─────────────────────────────────────────────
// 全站頁尾：唯一的「和我聊聊」＋聯絡方式（各頁不再重複放）
// ─────────────────────────────────────────────
async function renderFooter() {
  if (document.querySelector('.sf')) return;
  const [c, h] = await Promise.all([
    fetchJSON('/data/contact.json').catch(() => ({})),
    fetchJSON('/data/home.json').catch(() => ({})),
  ]);
  const onContact = /^\/(pages\/contact|quote)/.test(location.pathname);
  const links = [
    c.email && `<a href="mailto:${escHTML(c.email)}">${escHTML(c.email)}</a>`,
    c.instagram && `<a href="${escHTML(c.instagram)}" target="_blank" rel="noopener">Instagram ↗</a>`,
    c.behance && `<a href="${escHTML(c.behance)}" target="_blank" rel="noopener">Behance ↗</a>`,
    c.linkedin && `<a href="${escHTML(c.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`,
  ].filter(Boolean);
  const f = document.createElement('footer');
  f.className = 'sf';
  f.innerHTML = `
    ${onContact ? '' : `<div class="sf__cta">
      <h2 class="sf__title">${escHTML(h.ctaTitle || '有想法嗎？和我聊聊。')}</h2>
      ${h.ctaText ? `<p class="sf__text">${escHTML(h.ctaText)}</p>` : ''}
      <a class="hm-btn" href="/quote/#h4">${escHTML(h.ctaButton || '和我聊聊')} →</a>
    </div>`}
    <div class="sf__bar">
      <p class="sf__links">${links.join('<span aria-hidden="true">/</span>')}</p>
      <p class="sf__copy">© ${new Date().getFullYear()} YENPOPPY</p>
    </div>
    <a class="sf__logo" href="/" aria-label="YENPOPPY 首頁"><img src="/public/uploads/yenpoppy-wordmark.svg" alt="YENPOPPY" loading="lazy"></a>`;
  const main = document.getElementById('page-content') || document.getElementById('main');
  (main ? main.parentElement : document.body).insertBefore(f, main ? main.nextSibling : null);
}

// 內頁開場：一行中文標題＋一句說明（2026-11-11 精簡版）
function pageHead({ en = '', title, lead = '', extra = '' }) {
  return `
    <header class="pg-head">
      ${en ? `<p class="pg-head__en">${en}</p>` : ''}
      <h1 class="pg-head__title">${clauses(escHTML(title).replace(/==(.+?)==/g, '<mark>$1</mark>'))}</h1>
      ${lead ? `<p class="pg-head__lead">${escHTML(lead)}</p>` : ''}
      ${extra}
    </header>`;
}


// 合作洽詢頁（/quote/）最後補上合作流程與常見問題（資料沿用 about.json、contact.json）
async function renderQuoteExtras() {
  const steps = document.querySelector('.steps');
  if (!steps || document.querySelector('.q-extra')) return;
  const [about, c] = await Promise.all([
    fetchJSON('/data/about.json').catch(() => ({})),
    fetchJSON('/data/contact.json').catch(() => ({})),
  ]);
  const pad2 = i => String(i + 1).padStart(2, '0');
  const wrap = document.createElement('div');
  wrap.className = 'q-extra';
  wrap.innerHTML = `
    ${(about.process || []).length ? `<section class="q-extra__sec">
      <div class="step-h"><h2>合作流程</h2></div>
      <ol class="ab2-steps">${about.process.map((p, i, arr) => `
        <li style="--p:${(i + 1) / arr.length}"><div class="ab2-steps__top"><span class="ab2-big">${pad2(i)}</span>${i < arr.length - 1 ? '<span class="ab2-steps__arrow" aria-hidden="true">→</span>' : ''}</div>
          <span class="ab2-steps__bar" aria-hidden="true"></span>
          <h3 class="ab2-h3">${escHTML(p.zh)}</h3><p class="ab2-desc">${escHTML(p.desc)}</p></li>`).join('')}
      </ol>
    </section>` : ''}
    ${(c.faq || []).length ? `<section class="q-extra__sec">
      <div class="step-h"><h2>常見問題</h2></div>
      <div class="ct-faq">${c.faq.map(f => `
        <details><summary>${escHTML(f.q)}</summary><p>${inlineLinks(f.a)}</p></details>`).join('')}
      </div>
    </section>` : ''}`;
  steps.appendChild(wrap);
}


// 頁首：往下滑隱藏、往上滑出現（沿用舊站動態）
(function () {
  let last = window.scrollY, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, h = document.getElementById('site-header');
      const menuOpen = document.getElementById('mobile-nav')?.classList.contains('open');
      if (h && !menuOpen) {
        if (y > last + 4 && y > 160) h.classList.add('hd-hide');
        else if (y < last - 4 || y < 160) h.classList.remove('hd-hide');
      }
      last = y; ticking = false;
    });
  }, { passive: true });
})();

// About 合作品牌：一整排自動左右輪播、輪流亮起（滑鼠移上暫停）
function initLogoMarquee() {
  const box = document.querySelector('.ab2-marquee');
  if (!box || box.dataset.ready) return;
  box.dataset.ready = '1';
  const ul = box.querySelector('.ab2-logos');
  const copy = ul.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach(a => a.tabIndex = -1);
  box.appendChild(copy);
  box.classList.add('is-scroll');
  // 自動往左捲；手指／滑鼠可以左右拖，放開 1.5 秒後繼續
  let pos = 0, last = performance.now(), hold = 0, hover = false;
  const pause = () => { hold = performance.now() + 1500; };
  ['touchstart', 'touchmove', 'wheel', 'pointerdown'].forEach(ev => box.addEventListener(ev, pause, { passive: true }));
  box.addEventListener('mouseenter', () => { hover = true; });
  box.addEventListener('mouseleave', () => { hover = false; });
  box.addEventListener('scroll', () => { if (Math.abs(box.scrollLeft - pos) > 2) { pos = box.scrollLeft; pause(); } }, { passive: true });
  // 經過中間的那個 logo 亮起
  const all = [...ul.children, ...copy.children];
  const tick = (now) => {
    const dt = Math.min(64, now - last); last = now;
    const w = ul.offsetWidth;
    if (w && !hover && now > hold) {
      pos += w / 70000 * dt;
      if (pos >= w) pos -= w;
      box.scrollLeft = pos;
    } else if (w && box.scrollLeft >= w) { pos = box.scrollLeft - w; box.scrollLeft = pos; }
    const r = box.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const mid = r.left + r.width / 2;
      let best = null, bd = Infinity;
      all.forEach(li => { const b = li.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = li; } });
      all.forEach(li => li.classList.toggle('is-on', li === best));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
new MutationObserver(() => initLogoMarquee()).observe(document.documentElement, { childList: true, subtree: true });

// 標題只在逗號後換行：每個子句包成不斷行的區塊（避免「在／乎」被拆開）
function clauses(html) {
  return String(html).split(/(?<=[，、；：])/).map(t => `<span class="clause">${t}</span>`).join('');
}

// 回到頂部：往下捲超過 1.5 個畫面才出現
(function () {
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'to-top'; btn.setAttribute('aria-label', '回到頂部'); btn.textContent = '↑';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  const add = () => { document.body.appendChild(btn); onScroll(); };
  let on = false;
  function onScroll() { const v = window.scrollY > window.innerHeight * 1.5; if (v !== on) { on = v; btn.classList.toggle('is-on', v); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
