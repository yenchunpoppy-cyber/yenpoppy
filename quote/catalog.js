/* YENPOPPY STUDIO 服務價目表
 * 報價單產生器（admin.html）與客戶估價頁（index.html）共用這一份。
 * 改價格只要改這裡：price = 預設單價，min/max = 客戶估價頁顯示的區間，
 * days = 預估工作天（不含假日），unit = 計價單位。
 * 層級：分類 → 項目 → 規格（options）。有 options 的項目，價格與天數以所選規格為準。
 */
window.CATALOG = {
  version: '2026-10-28h', // 改價後更新，舊草稿會改用範例重新開始
  // 報價單產生器「完整細項」用；group = 清單裡的小標
  categories: [
    {
      id: 'brand', name: '品牌識別', en: 'Branding',
      items: [
        { id: 'logo-basic', group: '識別', name: 'LOGO 設計（基本）', unit: '式', price: 25000, min: 22500, max: 28700, days: 15,
          desc: '提案 1 款方向，含 2 次修改；交付 AI / PDF / PNG' },
        { id: 'logo', group: '識別', name: 'LOGO 設計（標準）', unit: '式', price: 35000, min: 31500, max: 40200, days: 20,
          desc: '標誌＋標準字，提案 2 款方向，選定 1 款完稿；交付 AI / PDF / PNG' },
        { id: 'brand-set', group: '識別', name: '完整品牌識別', unit: '式', price: 60000, min: 54000, max: 69000, days: 25,
          desc: '標誌＋英文標準字＋輔助元素×3、標誌使用規範、色彩企劃、中英字型設定' },
        { id: 'id-onepage', group: '識別', name: '一頁式識別設定', unit: '份', price: 6000, min: 5400, max: 6900, days: 5,
          desc: '色彩企劃與品牌中英字型設定，整理成一頁' },
        { id: 'id-guide', group: '識別', name: '品牌識別手冊', unit: '份', price: 15000, min: 13500, max: 17200, days: 10,
          desc: '標誌使用規範、色彩、字型、錯誤示範' },
        { id: 'pattern', group: '延伸', name: '品牌花紋與輔助圖形', unit: '式', price: 8000, min: 7200, max: 9200, days: 7 },
        { id: 'ip', group: '延伸', name: '品牌 IP 角色', unit: '式', price: 20000, min: 18000, max: 23000, days: 15,
          desc: '角色設定＋3 個基本動作' },
        { id: 'slides', group: '延伸', name: '簡報版型', unit: '式', price: 10000, min: 9000, max: 11500, days: 7 },
        { id: 'card', group: '延伸', name: '名片設計與印刷監製', unit: '式', price: 6000, min: 5400, max: 6900, days: 10, print: true,
          desc: '印刷費依廠商報價實報實銷' }
      ]
    },
    {
      id: 'pkg', name: '包裝設計', en: 'Packaging',
      items: [
        { id: 'pkg-flat', group: '包裝', name: '包裝設計（平面包材）', unit: '款', price: 25000, min: 22500, max: 28700, days: 12, print: true,
          desc: '頭卡、標籤、吊卡；提案 2 款，選定 1 款完稿，含出血與刀模線' },
        { id: 'pkg-box', group: '包裝', name: '包裝設計（單一盒袋）', unit: '款', price: 48000, min: 43200, max: 55200, days: 18, print: true,
          desc: '使用現成刀模；提案 2 款，5–6 面完稿，含法規文字與條碼排版' },
        { id: 'gift-box', group: '包裝', name: '包裝設計（禮盒組合）', unit: '套', price: 70000, min: 63000, max: 80500, days: 30, print: true,
          desc: '外盒＋內襯＋配件視覺與結構，打樣至量產監製' },
        { id: 'pkg-variant-flat', group: '延伸款', name: '延伸款（平面包材）', unit: '款', price: 7500, min: 6800, max: 8600, days: 3, print: true,
          desc: '沿用主款版型，換口味、顏色或文字；含 1 次修改' },
        { id: 'pkg-variant-box', group: '延伸款', name: '延伸款（盒型）', unit: '款', price: 14000, min: 12600, max: 16100, days: 3, print: true,
          desc: '沿用主款版型，換口味、顏色或文字；含 1 次修改' },
        { id: 'pkg-structure', group: '加購', name: '新結構與刀模', unit: '式', price: 15000, min: 13500, max: 17200, days: 10,
          desc: '展開圖、紙材與加工建議，含白樣確認' },
        { id: 'pkg-mockup', group: '加購', name: '包裝模擬圖', unit: '張', price: 4000, min: 3600, max: 4600, days: 3,
          desc: '上架、募資、提案用的產品圖，3D 建模或合成後精修' },
        { id: 'print-manage', group: '加購', name: '印刷監製', unit: '次', price: 3000, min: 2700, max: 3400, days: 7, print: true,
          desc: '廠商詢價、完稿發包、看樣監製；或以印刷費 10% 計' }
      ]
    },
    {
      id: 'visual', name: '視覺與印刷', en: 'Visual & Print',
      items: [
        { id: 'kv', group: '主視覺', name: '主視覺設計', unit: '式', price: 28000, min: 25200, max: 32200, days: 14,
          desc: '1 款主視覺，含 3 個延伸尺寸' },
        { id: 'illus-kv', group: '主視覺', name: '插畫主視覺', unit: '式', price: 15000, min: 13500, max: 17200, days: 14 },
        { id: 'logotype', group: '主視覺', name: '視覺標準字', unit: '式', price: 8000, min: 7200, max: 9200, days: 7 },
        { id: 'resize', group: '主視覺', name: '延伸尺寸', unit: '個尺寸', price: 800, min: 700, max: 900, days: 3,
          desc: '社群、Banner、廣告等尺寸調整；大幅改版以 1,500 計' },
        { id: 'art-direction', group: '主視覺', name: '美術指導', unit: '天', price: 10000, min: 9000, max: 11500, days: 1,
          desc: '棚拍、影片現場的視覺指導' },
        { id: 'poster', group: '印刷品', name: '海報', unit: '款', price: 6000, min: 5400, max: 6900, days: 10, print: true },
        { id: 'ticket', group: '印刷品', name: '票券', unit: '款', price: 4000, min: 3600, max: 4600, days: 7, print: true },
        { id: 'dm', group: '印刷品', name: '單頁 DM', unit: '款', price: 4000, min: 3600, max: 4600, days: 7, print: true,
          desc: '單張雙面，含小卡、明信片' },
        { id: 'dm-fold', group: '印刷品', name: '摺頁 DM', unit: '款', price: 8000, min: 7200, max: 9200, days: 10, print: true,
          desc: '對摺或三摺' },
        { id: 'catalog', group: '印刷品', name: '型錄封面與版型設定', unit: '式', price: 8000, min: 7200, max: 9200, days: 7, print: true,
          desc: '封面設計、內頁版型與字體規範' },
        { id: 'catalog-page', group: '印刷品', name: '型錄內頁編排', unit: '頁', price: 1500, min: 1400, max: 1700, days: 1,
          desc: '依頁數計，頁數以 4 的倍數為主' },
        { id: 'sticker', group: '印刷品', name: '貼紙', unit: '款', price: 2500, min: 2200, max: 2900, days: 7, print: true },
        { id: 'menu', group: '印刷品', name: '菜單視覺', unit: '式', price: 8000, min: 7200, max: 9200, days: 10, print: true },
        { id: 'menu-layout', group: '印刷品', name: '菜單內頁編排', unit: '頁', price: 1500, min: 1400, max: 1700, days: 5 },
        { id: 'bar-menu', group: '印刷品', name: '單張酒單', unit: '款', price: 6000, min: 5400, max: 6900, days: 10, print: true },
        { id: 'banner-cloth', group: '印刷品', name: '大型輸出', unit: '款', price: 5000, min: 4500, max: 5800, days: 7, print: true,
          desc: '掛布、背板、帆布' }
      ]
    },
    {
      id: 'social', name: '社群經營', en: 'Social Media',
      items: [
        { id: 'post-cover', group: '貼文', name: '貼文封面', unit: '張', price: 1800, min: 1600, max: 2100, days: 5,
          desc: '尺寸 1080×1350，交付 PNG / JPG' },
        { id: 'post-text', group: '貼文', name: '貼文內頁（文字編排）', unit: '張', price: 900, min: 800, max: 1000, days: 5 },
        { id: 'post-layout', group: '貼文', name: '貼文內頁（圖面排版）', unit: '張', price: 800, min: 700, max: 900, days: 5 },
        { id: 'story', group: '貼文', name: '限時動態', unit: '張', price: 600, min: 500, max: 700, days: 3 },
        { id: 'social-month', group: '貼文', name: '社群月包（8 篇）', unit: '月', price: 32000, min: 28800, max: 36800, days: 20,
          desc: '每篇封面 1 張＋內頁 3 張，每月固定排程' },
        { id: 'social-kv', group: '帳號形象', name: '社群主視覺', unit: '式', price: 12000, min: 10800, max: 13800, days: 10 },
        { id: 'grid', group: '帳號形象', name: '九宮格貼文', unit: '格', price: 800, min: 700, max: 900, days: 5 },
        { id: 'ig-frame', group: '帳號形象', name: 'IG 貼文圖框', unit: '款', price: 2500, min: 2200, max: 2900, days: 10 },
        { id: 'ig-icon', group: '帳號形象', name: 'IG 精選動態圖示', unit: '款', price: 600, min: 500, max: 700, days: 7 },
        { id: 'line-menu', group: '帳號形象', name: 'LINE 圖文選單', unit: '款', price: 3500, min: 3000, max: 4000, days: 7,
          desc: '2500×1686 px' },
        { id: 'e-invite', group: '帳號形象', name: '電子邀請函', unit: '款', price: 2500, min: 2200, max: 2900, days: 5 }
      ]
    },
    {
      id: 'web', name: '網站設計', en: 'Web',
      items: [
        { id: 'web-setup', group: '建置', name: '網站建置與平台設定', unit: '式', price: 10000, min: 9000, max: 11500, days: 10,
          desc: '網域及平台月費另計' },
        { id: 'web-home', group: '頁面', name: '官網首頁', unit: '頁', price: 25000, min: 22500, max: 28700, days: 15,
          desc: '電商首頁含輪播 Banner、分類、商品版型時以 40,000 計' },
        { id: 'web-page', group: '頁面', name: '內頁', unit: '頁', price: 8000, min: 7200, max: 9200, days: 10 },
        { id: 'web-block', group: '頁面', name: '網頁區塊（響應式）', unit: '區塊', price: 3500, min: 3200, max: 4000, days: 3 },
        { id: 'web-product', group: '頁面', name: '商品介紹長頁', unit: '頁', price: 22000, min: 19800, max: 25300, days: 15 },
        { id: 'web-maintain', group: '維護', name: '網站維護年約', unit: '年', price: 30000, min: 27000, max: 34500, days: 5,
          desc: '每年 12 篇內容更新、定期測試、平台與網域續約' }
      ]
    }
  ],

  // 客戶估價頁與產生器「常用」模式：分類 → 項目 → 規格
  // 有 options 時，卡片上可切換規格；價格、單位、天數以規格為準
  publicMenu: [
    {
      id: 'brand', name: '品牌識別', intro: '從一個 LOGO 到整套識別',
      items: [
        { id: 'p-brand', name: '品牌識別', desc: '標誌、標準字到完整規範', options: [
          { id: 'basic', name: 'LOGO 基本', unit: '式', price: 25000, min: 22500, max: 28700, days: 15, desc: '標誌設計' },
          { id: 'std', name: 'LOGO 標準', unit: '式', price: 35000, min: 31500, max: 40200, days: 20, desc: '標誌＋中英標準字' },
          { id: 'full', name: '完整識別', unit: '式', price: 60000, min: 54000, max: 69000, days: 25, desc: 'LOGO＋色彩字型＋規範手冊' }
        ] },
        { id: 'p-card', name: '品牌延伸物', unit: '款', price: 6000, min: 5400, max: 6900, days: 10, print: true,
          desc: '名片、吊牌、貼紙' }
      ]
    },
    {
      id: 'pkg', name: '包裝設計', intro: '依包材類型計價',
      items: [
        { id: 'p-pkg', name: '包裝設計', print: true, desc: '都是用現成盒型做平面設計。需要開新刀模、設計新結構，會另外報價', options: [
          { id: 'flat', name: '平面包材', unit: '款', price: 25000, min: 22500, max: 28700, days: 12, desc: '頭卡、標籤、吊卡' },
          { id: 'box', name: '單一盒袋', unit: '款', price: 48000, min: 43200, max: 55200, days: 18, desc: '一個紙盒、立袋或罐標' },
          { id: 'gift', name: '禮盒組合', unit: '套', price: 70000, min: 63000, max: 80500, days: 30, desc: '外盒＋內襯＋卡片等多件一起設計' }
        ] },
        { id: 'p-variant', name: '延伸款', print: true, desc: '換口味、換顏色，約主款的 30%', options: [
          { id: 'flat', name: '平面包材', unit: '款', price: 7500, min: 6800, max: 8600, days: 3 },
          { id: 'box', name: '單一盒袋', unit: '款', price: 14000, min: 12600, max: 16100, days: 3 }
        ] }
      ]
    },
    {
      id: 'visual', name: '視覺與印刷', intro: '主視覺與各種印刷品',
      items: [
        { id: 'p-kv', name: '主視覺設計', unit: '式', price: 28000, min: 25200, max: 32200, days: 14,
          desc: '活動、新品、檔期都適用。設計 1 款主視覺，再延伸成 3 種尺寸，例如海報、IG 貼文、橫幅' },
        { id: 'p-printed', name: '印刷品', print: true, options: [
          { id: 'dm', name: '單頁 DM', unit: '款', price: 4000, min: 3600, max: 4600, days: 7, desc: '單張雙面，含小卡、明信片' },
          { id: 'dm-fold', name: '摺頁 DM', unit: '款', price: 8000, min: 7200, max: 9200, days: 10, desc: '對摺或三摺' },
          { id: 'poster', name: '海報', unit: '款', price: 6000, min: 5400, max: 6900, days: 10 }
        ] },
        { id: 'p-catalog', name: '型錄／手冊', print: true, desc: '封面＋版型設定＋內頁編排。更多頁數可寫在下方「其他想做的」', options: [
          { id: 'p8', name: '8 頁', unit: '本', price: 20000, min: 18000, max: 23000, days: 15 },
          { id: 'p16', name: '16 頁', unit: '本', price: 32000, min: 28800, max: 36800, days: 20 },
          { id: 'p24', name: '24 頁', unit: '本', price: 44000, min: 39600, max: 50600, days: 25 }
        ] }
      ]
    },
    {
      id: 'social', name: '社群經營', intro: 'IG、FB、LINE 的日常素材',
      items: [
        { id: 'p-post', name: '社群貼文', desc: '每篇封面＋內頁 3 張', options: [
          { id: 'one', name: '單篇', unit: '篇', price: 3500, min: 3200, max: 4000, days: 5 },
          { id: 'month', name: '月包 8 篇', unit: '月', price: 32000, min: 28800, max: 36800, days: 20, desc: '每月固定排程' }
        ] },
        { id: 'p-line', name: 'LINE 圖文選單', unit: '款', price: 3500, min: 3000, max: 4000, days: 7,
          desc: 'LINE 官方帳號下方的選單圖' }
      ]
    },
    {
      id: 'web', name: '網站設計', intro: '品牌官網與商品頁',
      items: [
        { id: 'p-site', name: '網站設計', options: [
          { id: 'brand', name: '形象官網', unit: '式', price: 59000, min: 53100, max: 67800, days: 25, desc: '首頁＋3 個內頁（如關於、服務、聯絡），含網站建置' },
          { id: 'long', name: '商品長頁', unit: '頁', price: 22000, min: 19800, max: 25300, days: 15 }
        ] },
        { id: 'p-page', name: '加購內頁', unit: '頁', price: 8000, min: 7200, max: 9200, days: 3,
          desc: '頁面不夠時，每多一頁加購' }
      ]
    }
  ],

  // 加購與附加費：rate = 依「設計項目小計」的比例計算；price = 固定金額
  addons: [
    { id: 'rush', name: '急件（一週內交付）', rate: 0.3, note: '設計費 +30%；3 個工作天內 +50%' },
    { id: 'rush3', name: '特急件（3 個工作天內）', rate: 0.5, note: '設計費 +50%' },
    { id: 'ai-file', name: '原始檔（社群類）', rate: 0.3, note: '社群類 +30%；品牌、包裝類已含原始檔' },
    { id: 'license', name: '授權商用（代理商轉售）', rate: 0.3, note: '設計費 +30%' },
    { id: 'revision', name: '額外修改', price: 2000, note: '超出約定次數，每次' }
  ],

  // 估價頁「提案與修改」：依提案數和修改次數調整設計費
  plans: [
    { id: 'lite', name: '精簡', en: 'LITE', proposals: 1, revisions: 1, rate: 0.85, desc: '方向明確，想省一點預算' },
    { id: 'std', name: '標準', en: 'STANDARD', proposals: 2, revisions: 2, rate: 1, desc: '大多數案子的選擇' },
    { id: 'plus', name: '充裕', en: 'PLUS', proposals: 3, revisions: 4, rate: 1.25, desc: '想多比較、多調整' }
  ],

  // 客戶估價頁的風格選項：可複選 2 種搭配，倍率取兩者中較高的區間 [低, 高]
  // 風格本身不分貴賤；只有原創插畫因為工時多，區間較高
  styles: [
    { id: 'minimal', name: '極簡現代', en: 'MINIMAL', level: 1, rate: [1, 1.1],
      desc: '大量留白、有限配色與清晰字體，俐落理性', eg: '科技、顧問、精品品牌' },
    { id: 'soft', name: '柔和自然', en: 'SOFT', level: 2, rate: [1, 1.1],
      desc: '低飽和配色與柔和質感，溫潤有空氣感', eg: '咖啡、保養、生活風格品牌' },
    { id: 'vintage', name: '復古經典', en: 'VINTAGE', level: 2, rate: [1, 1.1],
      desc: '以年代感字體、配色與紋理營造懷舊氛圍', eg: '老字號、餐飲、文創商品' },
    { id: 'luxe', name: '典雅精緻', en: 'LUXURY', level: 3, rate: [1, 1.1],
      desc: '細緻紋樣、燙金與襯線字體，呈現高級感', eg: '禮盒、婚禮、高單價商品' },
    { id: 'playful', name: '活潑親和', en: 'PLAYFUL', level: 3, rate: [1, 1.1],
      desc: '明亮配色與圓潤造型，輕鬆好親近', eg: '零食、親子、年輕品牌' },
    { id: 'illus', name: '插畫手繪', en: 'ILLUSTRATION', level: 4, rate: [1.3, 1.6],
      desc: '以原創插畫為主視覺，工時較多，價格會高一些', eg: '插畫包裝、角色、插畫主視覺' },
    { id: 'unsure', name: '還不確定', en: 'NOT SURE', level: 0, rate: [1, 1.15],
      desc: '可以上傳參考圖，再一起判斷方向', eg: '' }
  ],

  // 估價頁「關於你」：了解詢價的人是誰（選填）
  audience: {
    roles: ['品牌／公司', '店家老闆', '個人創作者', '個人需求', '設計或行銷公司', '同行設計師', '好奇看看'],
    industries: ['美妝保養', '珠寶飾品', '餐飲', '食品', '生活選物', '時尚服飾', '文創', '婚禮活動', '科技', '其他']
  },

  // 試算數據：填入 Google Apps Script 網址後，每次試算會記一筆（稱呼選填，不含聯絡方式）
  statsEndpoint: '',

  revisions: 2,          // 含修改次數
  revisionFee: 2000,     // 超出每次
  minFee: 8000,          // 單次合作最低金額
  depositRate: 0.5,      // 訂金比例
  invoiceTax: 0.05,      // 代開發票營業稅
  validDays: 15,         // 報價有效天數
  reviewDays: 3,         // 委託方審稿工作天
  leadDays: 5            // 目前排程：最快幾個工作天後可以開始新案（忙的時候調大）
};
