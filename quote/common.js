/* 共用工具：金額格式、工作天計算、時程產生 */
(function () {
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const money = n => 'NT$' + Math.round(n).toLocaleString('en-US');
  const num = n => Math.round(n).toLocaleString('en-US');
  const short = d => `${d.getMonth() + 1}/${pad(d.getDate())}（${WEEK[d.getDay()]}）`;
  const long = d => `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;

  // blocked: Set of 'YYYY-MM-DD' 不接案日（出國、休假）
  function isWorkday(d, blocked) {
    const w = d.getDay();
    return w !== 0 && w !== 6 && !(blocked && blocked.has(iso(d)));
  }
  function nextWorkday(d, blocked) {
    const x = new Date(d);
    while (!isWorkday(x, blocked)) x.setDate(x.getDate() + 1);
    return x;
  }
  // 從 start（含）起算 n 個工作天，回傳 [第一天, 最後一天]
  function span(start, n, blocked) {
    const first = nextWorkday(start, blocked);
    const last = new Date(first);
    let left = Math.max(1, n) - 1;
    while (left > 0) {
      last.setDate(last.getDate() + 1);
      if (isWorkday(last, blocked)) left--;
    }
    return [first, last];
  }
  function afterDay(d) { const x = new Date(d); x.setDate(x.getDate() + 1); return x; }

  // 依選擇的項目估算設計工期：最長的一項＋其他項目的 1/4（可平行作業）
  function designDays(lines) {
    const ds = lines.map(l => (l.days || 0) * (l.qty > 3 ? 1.2 : 1)).sort((a, b) => b - a);
    if (!ds.length) return 0;
    return Math.ceil(ds[0] + ds.slice(1).reduce((s, x) => s + x / 4, 0));
  }

  // 產生預設時程階段：項目工作天已含確認、審稿與修改，在總天數內切分
  function defaultPhases(lines, reviewDays) {
    const total = Math.max(designDays(lines), 6);
    if (!lines.length) return [];
    const review = reviewDays || 3;
    const confirm = Math.max(1, Math.round(total * 0.1));
    const rest = Math.max(3, total - confirm - review - 1);
    const draft = Math.ceil(rest * 0.6), refine = Math.max(1, rest - draft);
    const phases = [
      { name: '需求確認與素材提供', desc: '確認製作需求、提供品牌素材與文案，完成製作內容確認', days: confirm },
      { name: '初稿設計', desc: '依確認內容進行設計，提交初稿', days: draft },
      { name: '委託方審稿', desc: '委託方整理完整修改意見後統一回覆', days: review },
      { name: '修改與完稿', desc: '依回饋調整，完成最終完稿', days: refine },
      { name: '驗收與交付檔案', desc: '驗收確認後交付所有檔案', days: 1 }
    ];
    if (lines.some(l => l.print)) phases.splice(4, 0, { name: '印刷發包與監製', desc: '完稿發包、看樣監製；交期依廠商排程', days: 7 });
    return phases;
  }

  // 把階段排上日曆
  function schedule(phases, startIso, blocked) {
    let cur = parse(startIso);
    return phases.map(p => {
      const [a, b] = span(cur, p.days, blocked);
      cur = afterDay(b);
      return { ...p, start: a, end: b };
    });
  }

  function findItem(id) {
    for (const c of window.CATALOG.categories) for (const it of c.items) if (it.id === id) return { ...it, cat: c.id };
    return null;
  }

  window.YP = { WEEK, iso, parse, money, num, short, long, isWorkday, nextWorkday, span, designDays, defaultPhases, schedule, findItem };
})();
