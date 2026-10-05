/*
  教師端原型（frontend/src/prototypes/教師端_最初版.js）裡寫死的假資料，
  搬過來這裡讓各畫面元件 import 使用。之後接後端 API 時，這個檔案可以
  直接被「打 API 拿資料」取代，畫面元件不用大改。
*/

export const COURSES = [
  {
    id: 'c1',
    term: '114-1 學期',
    icon: 'grad',
    title: 'AI 提示工程與批判思考',
    cardMeta: ['32 位學生　· 每週三 3-4 節', '已開設 3 場競賽'],
    detailMeta: '114-1 學期 · 32 位學生 · 每週三 3-4 節',
  },
  {
    id: 'c2',
    term: '114-1 學期',
    icon: 'bars',
    title: '資訊管理專題研究',
    cardMeta: ['18 位學生　· 每週五 6-7 節', '已開設 1 場競賽'],
    detailMeta: '114-1 學期 · 18 位學生 · 每週五 6-7 節',
  },
  {
    id: 'c3',
    term: '114 上 · 推廣班',
    icon: 'trend',
    title: '數位轉型與商業分析',
    cardMeta: ['45 位學生（含在職人士）　· 週末班', '尚未開設競賽'],
    detailMeta: '114 上 · 推廣班 · 45 位學生（含在職人士）· 週末班',
  },
]

/*
  題庫分類：題庫除了「難度」之外也依「分類」整理，老師發起競賽時是從分類裡挑題目。
  每題的 category 要等於這裡其中一個 name；industry 是更細的產業說明（自由填寫）。
*/
// 題庫的四個難度（側邊欄與題庫管理共用）
export const BANK_LEVELS = [
  { name: '青銅', tone: '#B0703C', tag: '入門情境', mark: '★' },
  { name: '白銀', tone: '#8A92A8', tag: '進階情境', mark: '★★' },
  { name: '黃金', tone: '#D9A82E', tag: '挑戰情境', mark: '★★★' },
  { name: '鑽石', tone: '#3FA9E0', tag: '高階情境', mark: '◆' },
]

export const CATEGORIES = [
  { name: '供應鏈與營運', tone: '#3F97E0', tag: '採購、物流、供應商管理' },
  { name: '人力資源與勞動', tone: '#E0709A', tag: '用人、勞資、組織文化' },
  { name: '行銷與定價', tone: '#F0A030', tag: '產品、價格、市場策略' },
  { name: '財務與投資', tone: '#35A97C', tag: '預算、成本、投資評估' },
  { name: '科技與資安', tone: '#8B6BD6', tag: '系統導入、資料與隱私' },
  { name: '品牌與公關', tone: '#E0584F', tag: '輿情、危機溝通、信任' },
]

// 每題固定 20 分鐘，發起競賽時不能修改，只能在競賽進行中由老師加時
export const FIXED_TIME_LIMIT = 20

export const FIXED_QUESTION_COUNT = 1

export const ROSTER = [
  { name: '劉亭慧', dept: '資管三', avg: '55%', attend: 12, email: 's1101001@nccu.edu.tw' },
  { name: '陳阿哲', dept: '資管三', avg: '61%', attend: 11, email: 's1101002@nccu.edu.tw' },
  { name: '林小薇', dept: '企管二', avg: '58%', attend: 12, email: 's1101003@nccu.edu.tw' },
  { name: '王志明', dept: '資管三', avg: '44%', attend: 9, email: 's1101004@nccu.edu.tw' },
  { name: '黃冠廷', dept: '財金三', avg: '52%', attend: 10, email: 's1101005@nccu.edu.tw' },
  { name: '吳雅婷', dept: '資管二', avg: '49%', attend: 12, email: 's1101006@nccu.edu.tw' },
  { name: '…', dept: '…', avg: '…', attend: '…', email: null },
]

export const PAST_COMPETITIONS = [
  {
    id: 'pc1',
    title: '供應鏈勞動爭議',
    meta: '2026/09/16 · 5 隊參賽 · 冠軍：E 隊',
    ranks: [
      { medal: 'gold', team: 'E 隊', members: '許庭瑜、林佳蓉、吳建宏' },
      { medal: 'silver', team: 'A 隊', members: '陳阿哲、林雅婷、王品文' },
      { medal: 'bronze', team: 'B 隊', members: '吳冠緯、張書豪' },
    ],
  },
  {
    id: 'pc2',
    title: '外送勞權兩難',
    meta: '2026/06/12 · 6 隊參賽 · 冠軍：A 隊',
    ranks: [
      { medal: 'gold', team: 'A 隊', members: '陳阿哲、林雅婷' },
      { medal: 'silver', team: 'C 隊', members: '劉亭慧、王志明' },
      { medal: 'bronze', team: 'D 隊', members: '黃冠廷、吳雅婷' },
    ],
  },
  {
    id: 'pc3',
    title: '新創資源分配決策',
    meta: '2026/05/03 · 4 隊參賽 · 冠軍：A 隊',
    ranks: [
      { medal: 'gold', team: 'A 隊', members: '陳阿哲、林雅婷、王品文' },
      { medal: 'silver', team: 'B 隊', members: '吳冠緯' },
      { medal: 'bronze', team: 'C 隊', members: '劉亭慧' },
    ],
  },
]

export const INITIAL_BANK = [
  {
    name: '供應鏈勞動爭議', diff: '黃金', category: '供應鏈與營運', industry: '電商 / 零售', source: 'sys', publish: 'public', questionCount: 1, owner: '系統預設',
    bg: '「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。',
    roles: '財務長：認為更換供應商將墊高短期成本並影響出貨穩定\n永續長：主張若不處理將重創品牌信任度\n人資長：擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層',
    gap: '供應商是否已著手改善尚未證實；更換供應商的實際交接時程與品質風險未知。',
    tension: '短期成本與出貨穩定 vs 品牌信任與倫理責任',
    checklist: ['財務影響量化', '員工／客戶影響評估', '替代方案比較', '執行時程與風險', '倫理／法遵考量', '溝通／揭露策略'],
    trap: '該產業平均違規率達 42%（無查證來源，屬幻覺陷阱範例）',
  },
  {
    name: '外送平台派單爭議兩難', diff: '白銀', category: '人力資源與勞動', industry: '物流平台', source: 'sys', publish: 'public', questionCount: 1, owner: '系統預設',
    bg: '「快送」是外送媒合平台，演算法派單以效率為核心指標，但外送員反映尖峰時段等待與超時罰款機制不合理，社群串連要求平台調整制度。',
    roles: '營運長：擔心調整演算法會拉長平均送達時間，影響用戶體驗\n外送員代表：要求透明化派單邏輯與合理的等待補償\n投資人：關注平台成長動能是否受影響',
    gap: '演算法實際邏輯屬商業機密，外部無法直接查核；外送員實際收入分布數據有限。',
    tension: '配送效率與平台成長 vs 外送員合理權益',
    checklist: ['派單機制透明度', '外送員收入影響評估', '替代方案比較', '執行時程與風險', '品牌與公關風險', '溝通／揭露策略'],
    trap: '外送員平均時薪較去年下降 30%（未經查證，屬幻覺陷阱範例）',
  },
  {
    name: '新品定價兩難', diff: '黃金', category: '行銷與定價', industry: '消費品', source: 'sys', publish: 'public', questionCount: 1, owner: '系統預設',
    bg: '某消費品牌即將推出新品，行銷部主張以低價快速搶市佔，財務部則堅持高毛利定價以維持品牌形象與獲利結構，雙方在上市前僵持不下。',
    roles: '行銷副理：主張低價策略搶佔市佔率\n財務長：堅持高毛利定價，擔心低價傷害品牌定位\n業務經理：擔心通路對定價策略的接受度',
    gap: '競品實際成本結構未知；低價策略對長期品牌價值的影響難以量化。',
    tension: '短期市佔率 vs 長期品牌與獲利健康',
    checklist: ['市場定位分析', '成本結構評估', '替代方案比較（至少兩種定價策略）', '通路接受度評估', '長期品牌影響', '溝通／揭露策略'],
    trap: '競品毛利率僅 8%（未經查證，屬幻覺陷阱範例）',
  },
  {
    name: '團隊留任 vs 派遣轉正', diff: '白銀', category: '人力資源與勞動', industry: '人力資源', source: 'own', publish: 'private', questionCount: 1, owner: '張欣綠（僅本人）',
    bg: '某部門有 5 名派遣人力已服務超過 2 年，部門主管希望轉正以留住熟練人力，但人事預算今年已被削減 15%，若全數轉正將排擠新進人力招募名額。',
    roles: '部門主管：希望轉正留住熟練人力\nHR：需在預算限制下平衡全公司人力配置\n派遣人力本人：期待穩定保障但尚未被告知決策方向',
    gap: '明年度預算是否會回升尚未確定；部分派遣人力是否有轉職意願未知。',
    tension: '留才穩定 vs 預算限制與公平性',
    checklist: ['預算影響量化', '員工士氣與留任率評估', '替代方案比較（部分轉正／分階段轉正）', '溝通與揭露策略'],
    trap: '（尚未標記已知幻覺陷阱）',
  },
  {
    name: '老字號手搖飲品牌轉型兩難', diff: '鑽石', category: '行銷與定價', industry: '餐飲連鎖', source: 'sys', publish: 'public', questionCount: 1, owner: '系統預設',
    bg: '「甜心堂」是經營 20 年的手搖飲連鎖品牌，全台有 120 家分店。近年年輕消費者轉向手作精品咖啡與低糖健康飲品，甜心堂營收連續三年下滑。',
    roles: '行銷部：提出「全面轉型健康低糖路線」\n研發與供應鏈：配方與供應商調整至少需要 8 個月\n財務部：擔心轉型期間流失既有重糖客群，導致現金流吃緊',
    gap: '轉型後既有客群會流失多少、新客群是否買單都無法確定；8 個月轉型期的實際成本未知。',
    tension: '短期現金流與既有客群 vs 長期品牌定位與轉型',
    checklist: ['比較「全面轉型」與「漸進式雙軌並行」', '短期現金流影響', '長期品牌定位', '8 個月轉型期的執行風險', 'AI 分析可能忽略的風險或假設'],
    trap: '（尚未標記已知幻覺陷阱）',
  },
  {
    name: '新創公司募資兩難', diff: '鑽石', category: '財務與投資', industry: 'B2B SaaS 新創', source: 'sys', publish: 'public', questionCount: 1, owner: '系統預設',
    bg: '一家 B2B SaaS 新創月營收成長穩定，但現金僅夠再撐 4 個月。天使輪投資人願意加碼，同時有一家策略型企業客戶提出併購意向。',
    roles: '天使輪投資人：願意加碼，但要求提高持股比例並取得董事會否決權\n策略型企業客戶：提出併購，估值略低於天使輪，但可立即解決現金危機並綁定大客戶\n創辦人團隊：在現金壓力下需要決定公司的走向',
    gap: '未來成長率與併購方後續策略都無法確定；讓出否決權對長期自主性的實際影響難以量化。',
    tension: '公司長期自主性與團隊 vs 現金危機與大客戶綁定',
    checklist: ['比較「接受加碼讓出否決權」與「被併購」', '對長期自主性的影響', '對團隊的影響', '標示 AI 無法確定的變數', '最終決策保留給創辦人與董事會'],
    trap: '（尚未標記已知幻覺陷阱）',
  },
]

export const TEAMS = [
  { name: 'A 隊', status: '已送出', dot: '#5FB894', cov: 64, question: 1, exchanges: 6, aiScore: 79, hinted: false, flags: [] },
  { name: 'B 隊', status: '討論中', dot: '#E7A857', cov: 48, question: 1, exchanges: 4, aiScore: 71, hinted: false, flags: [] },
  { name: 'C 隊', status: '停滯中', dot: '#C1495B', cov: 22, question: 1, exchanges: 2, aiScore: 54, hinted: true, flags: [{ t: '超過 90 秒無動作', c: 'amber' }], stalled: true },
  { name: 'D 隊', status: '已評分', dot: '#5FB894', cov: 80, question: 1, exchanges: 5, aiScore: 58, hinted: false, flags: [{ t: '命中幻覺陷阱', c: 'red' }], flagged: true },
  { name: 'E 隊', status: '已送出', dot: '#5FB894', cov: 56, question: 1, exchanges: 5, aiScore: 74, hinted: false, flags: [] },
]

export const CLASS_4D = [
  { key: 'D1', label: '委託', pct: 64, color: '#E8636B' },
  { key: 'D2', label: '描述', pct: 78, color: '#F5A93A' },
  { key: 'D3', label: '辨識', pct: 41, color: '#2FBF8F' },
  { key: 'D4', label: '盡責', pct: 29, color: '#4C8DFF' },
]

export const CLASS_4D_WEAK_THRESHOLD = 45

// 監控台「即時動態」：初始幾筆（ago 為幾秒前）＋模擬新事件的候選池
export const INITIAL_LIVE_EVENTS = [
  { team: 'B 隊', kind: 'point', text: '「供應商違規紀錄查證」新面向 +1', ago: 8 },
  { team: 'A 隊', kind: 'point', text: '「倫理／法遵考量」新面向 +1', ago: 27 },
  { team: 'D 隊', kind: 'halluc', text: '幻覺偵測：「產業違規率 42%」無法查核', ago: 52 },
  { team: 'C 隊', kind: 'hint', text: '教師已發送引導提示', ago: 95 },
  { team: 'E 隊', kind: 'point', text: '「員工／客戶影響評估」新面向 +1', ago: 131 },
  { team: 'A 隊', kind: 'redundant', text: '「財務影響量化」已涵蓋過，重複 0 分', ago: 168 },
  { team: 'D 隊', kind: 'point', text: '「溝通／揭露策略」新面向 +1', ago: 214 },
  { team: 'B 隊', kind: 'point', text: '「替代方案比較」新面向 +1', ago: 262 },
  { team: 'C 隊', kind: 'point', text: '「財務影響量化」新面向 +1', ago: 305 },
  { team: 'A 隊', kind: 'point', text: '「財務影響量化」新面向 +1', ago: 352 },
  { team: '全班', kind: 'hint', text: '競賽開始，已公布案例與規則', ago: 421 },
]

export const LIVE_EVENT_POOL = [
  { team: 'B 隊', kind: 'point', dim: '執行時程與風險' },
  { team: 'E 隊', kind: 'point', dim: '倫理／法遵考量' },
  { team: 'C 隊', kind: 'point', dim: '員工／客戶影響評估' },
  { team: 'A 隊', kind: 'point', dim: '替代方案比較' },
  { team: 'D 隊', kind: 'point', dim: '倫理／法遵考量' },
  { team: 'C 隊', kind: 'point', dim: '供應商財務體質查核', origin: 'team' },
  { team: 'A 隊', kind: 'point', dim: '消費者輿情監測', origin: 'team' },
  { team: 'D 隊', kind: 'halluc', text: '幻覺偵測：引用數據沒有來源' },
]

export const TEAM_DETAIL = {
  'A 隊': {
    status: '已送出',
    prompts: [
      { who: '陳阿哲', txt: '請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', score: 79, rep: true, votes: 3 },
      { who: '林雅婷', txt: '先幫我查一下這個供應商過去有沒有被開罰過。', score: 65, rep: false, votes: 1 },
    ],
    solution: '建議一：立即終止與現供應商的合約，改與通過我們稽核標準的新供應商簽約。\n預估影響：前三個月因交接與磨合，物流成本上升約 15%，但可避免持續的勞動爭議聲量擴大。\n建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。\n風險：更換供應商本身需要 4-6 週的過渡期，這段期間可能出現交貨延遲。\n（本隊尚未評估員工與現有供應商窗口的關係維護，這部分後續需要 HR 與採購共同討論。）',
    coverage: [
      { item: '財務影響量化', ok: true, note: '有具體數字（15%）與時間區間（三個月）' },
      { item: '替代方案比較', ok: false, note: '僅提出單一方案，缺乏與「維持現狀」的對照評估' },
      { item: '倫理／法遵考量', ok: true, note: '有提出罰則承諾書與第三方稽核機制' },
    ],
    hallucination: null,
  },
  'B 隊': {
    status: '討論中',
    prompts: [
      { who: '吳建宏', txt: '幫我比較維持現供應商加強稽核，跟直接換供應商，兩個方案的財務跟品牌風險。', score: 71, rep: true, votes: 2 },
    ],
    solution: '建議採取分階段稽核：先要求供應商提供近一年的勞檢紀錄，若無法提供則視為違規，公司同步啟動備援供應商評估，但暫不終止現有合約，以降低短期斷貨風險。',
    coverage: [
      { item: '替代方案比較', ok: true, note: '有明確比較「加強稽核」與「更換供應商」兩條路徑' },
      { item: '財務影響量化', ok: false, note: '尚未提出具體數字' },
    ],
    hallucination: null,
  },
  'C 隊': {
    status: '停滯中',
    prompts: [
      { who: '王志明', txt: '這個供應商到底有沒有違反勞動法？幫我查一下。', score: 54, rep: false, votes: 0 },
    ],
    solution: '（本隊在本題送出提示前已超過時間上限，AI 尚未產出完整解方。）',
    coverage: [
      { item: '財務影響量化', ok: false, note: '尚未提出' },
      { item: '替代方案比較', ok: false, note: '尚未提出' },
    ],
    hallucination: null,
  },
  'D 隊': {
    status: '已評分',
    prompts: [
      { who: '黃冠廷', txt: '幫我把裁罰風險跟產業違規率整理一下，維持現供應商但加強稽核的方案。', score: 58, rep: true, votes: 2 },
    ],
    solution: '建議：維持現供應商，但要求對方在 30 天內提出改善計畫，並加派稽核人力。\n根據我們查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決問題。\n若供應商未能在期限內改善，才考慮啟動備援供應商評估。',
    coverage: [
      { item: '替代方案比較', ok: true, note: '有提出「限期改善」與「啟動備援」兩階段方案' },
      { item: '溝通／揭露策略', ok: true, note: '有提及對供應商的溝通期限與後續處理' },
    ],
    hallucination: { claim: '該產業平均違規率達 42%', note: '查核後找不到原始來源，判定為幻覺內容，本項不計分並已要求該隊重新查核。' },
  },
  'E 隊': {
    status: '已送出',
    prompts: [
      { who: '許庭瑜', txt: '我們想先確認員工端的反應，幫我想一下要怎麼問 AI 評估員工士氣風險。', score: 74, rep: true, votes: 2 },
    ],
    solution: '建議優先與員工／客服代表溝通，說明目前的因應方向與時程，再視稽核結果決定是否更換供應商；同時準備好對外聲明稿以因應可能的媒體詢問。',
    coverage: [
      { item: '員工／客戶影響評估', ok: true, note: '有明確聚焦在員工溝通與士氣風險' },
      { item: '溝通／揭露策略', ok: true, note: '有提出對外聲明稿的準備' },
    ],
    hallucination: null,
  },
}

// 隊伍詳情的「對話紀錄」：每筆是某位組員送出的 prompt 與他自己的 AI 的回覆；flag 'halluc' 表示該回覆被標記為疑似幻覺
export const TEAM_CHAT = {
  'A 隊': [
    { who: '陳阿哲', at: '02:10', prompt: '請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', reply: '三個月現金流影響：1. 交接與磨合期物流成本上升約 15%；2. 新供應商的稽核與簽約成本；3. 舊庫存處理。可能被低估的隱藏成本：品質磨合期的退貨率、緊急調貨的運費。' },
    { who: '林雅婷', at: '03:25', prompt: '先幫我查一下這個供應商過去有沒有被開罰過。', reply: '我無法即時查詢特定供應商的裁罰紀錄，建議到勞動部公開的違規事業單位名單查證，我可以協助整理需要核對的欄位。' },
    { who: '王品文', at: '05:02', prompt: '把前面兩位的重點整理成建議，要包含終止合約與第三方稽核。', reply: '建議一：終止現有合約，改與通過稽核標準的新供應商簽約。建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。' },
  ],
  'B 隊': [
    { who: '吳建宏', at: '02:48', prompt: '幫我比較維持現供應商加強稽核，跟直接換供應商，兩個方案的財務跟品牌風險。', reply: '維持現供應商：短期成本低、供應穩定，但品牌風險取決於改善成效；直接更換：成本與斷貨風險較高，但可向外界表明立場。建議以分階段稽核作為折衷。' },
    { who: '張書豪', at: '04:30', prompt: '那分階段稽核的第一步要怎麼設計？', reply: '第一步可要求供應商提供近一年勞檢紀錄與改善計畫，設定 30 天期限，同時啟動備援供應商評估。' },
  ],
  'C 隊': [
    { who: '王志明', at: '03:05', prompt: '這個供應商到底有沒有違反勞動法？幫我查一下。', reply: '我無法確認特定供應商是否違法，需以主管機關的查核結果為準。若要評估，可以先整理爆料內容、公司回應與已知的查核紀錄。' },
    { who: '劉亭慧', at: '04:12', prompt: '那我們先列出需要向供應商確認的問題。', reply: '可確認：工時紀錄、投保名冊、加班費計算方式、近期是否被勞檢，以及改善措施的時程。' },
  ],
  'D 隊': [
    { who: '黃冠廷', at: '02:20', prompt: '幫我把裁罰風險跟產業違規率整理一下，維持現供應商但加強稽核的方案。', reply: '根據我查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決。', flag: 'halluc' },
    { who: '吳雅婷', at: '03:40', prompt: '請說明剛剛 42% 這個數字的出處。', reply: '抱歉，我無法提供這個數字的可靠來源，建議不要直接引用，改以主管機關公布的統計為準。' },
    { who: '黃冠廷', at: '05:15', prompt: '好，那把方案改成限期 30 天改善、未達標再啟動備援供應商。', reply: '方案：要求供應商 30 天內提出改善計畫並加派稽核；若期限內未改善，才啟動備援供應商評估。' },
  ],
  'E 隊': [
    { who: '許庭瑜', at: '02:35', prompt: '我們想先確認員工端的反應，幫我想一下要怎麼評估員工士氣風險。', reply: '可從三方面評估：現有員工對事件的觀感、與供應商窗口的合作關係是否受影響、對外溝通不一致造成的內部疑慮。' },
    { who: '林佳蓉', at: '04:05', prompt: '再幫我們擬一份對外聲明稿的重點。', reply: '重點：承認議題、說明正在查證、公布稽核時程、承諾結果公開，語氣避免推卸責任。' },
  ],
}

export const PUSH_SUGGESTIONS = [
  { key: 'viewpoint', label: '換視角引導卡：試著從另一個利害關係人角度提問', text: '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？' },
  { key: 'hallu', label: '幻覺警示卡：請 AI 說明數字是怎麼算出來的', text: 'AI 剛剛給的數字，你要不要請它說明這個數字是怎麼算出來的？' },
  { key: 'blank', label: '空白區域卡：提醒還沒被涵蓋的解方面向', text: '目前全班還沒有人談到「執行時程與風險」，這個面向可能有分數在等你們。' },
  { key: 'time', label: '節奏調整：全班加時 2 分鐘', text: '教師已為全班加時 2 分鐘，把握機會補齊還沒探索的面向。' },
]

// 集體知識地圖：teams 為已涵蓋該面向的隊伍代號；origin 'team' 表示隊伍自創、不在官方檢查清單內
export const KMAP_INITIAL = [
  { dim: '財務影響量化', teams: ['A', 'B', 'C'] },
  { dim: '員工／客戶影響評估', teams: ['D', 'E'] },
  { dim: '替代方案比較', teams: ['B', 'C'] },
  { dim: '執行時程與風險', teams: [] },
  { dim: '倫理／法遵考量', teams: ['A'] },
  { dim: '溝通／揭露策略', teams: ['D'] },
  { dim: '供應商違規紀錄查證', teams: ['B', 'E'], origin: 'team' },
]

export const TEAM_COLORS = { A: '#E8636B', B: '#F5A93A', C: '#2FBF8F', D: '#4C8DFF', E: '#A57FE0' }



export function generateArenaCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  const link = 'https://promptarena.app/join/' + code
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=' + encodeURIComponent(link)
  return { code, link, qrUrl }
}

export function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try { document.execCommand('copy') } catch (e) { /* ignore */ }
  document.body.removeChild(ta)
}

// ───────────── 評分與總覽（賽後結算）─────────────
// 計分依 AI邏輯s.docx：解方分數 = A 基本要求(20) + B 涵蓋面向(70) + C 新面向加分 − D 幻覺扣分，限制 0～100。
// 總分沒有權重，直接相加：解方分數（滿分 100）＋ 別組給的互評平均（0～10 分）＋ 老師個別加分（0～10 分）。
// 4D 能力只當作能力指標顯示（雷達圖、排名表的參考欄），不計入總分。SCORE_MAX 是三項滿分加總，用來畫分數組成長條。
export const SCORE_MAX = 120

export const OFFICIAL_DIMS = ['財務影響量化', '員工／客戶影響評估', '替代方案比較', '執行時程與風險', '倫理／法遵考量', '溝通／揭露策略']
export const DIM_4D = [
  { key: 'D1', label: '委託' },
  { key: 'D2', label: '描述' },
  { key: 'D3', label: '辨識' },
  { key: 'D4', label: '盡責' },
]

const coverage = (levels, quotes = {}, uncertain = []) =>
  OFFICIAL_DIMS.map((dim, i) => ({ dim, level: levels[i], quote: quotes[i] || '', uncertain: uncertain.includes(i) }))

// level：0 沒提到、1 有提到但只是帶過、2 有具體做法或說明；bonusDims 為官方清單外的新面向（每個 +5，最多 +10）
export const RESULT_TEAMS = [
  {
    id: 'A', name: 'A 隊', members: ['陳阿哲', '林雅婷', '王品文'], peerRatings: [{ from: 'B 隊', score: 9, comment: '提出的稽核機制很具體，執行時程可以再補。' }, { from: 'C 隊', score: 9, comment: '財務量化清楚。' }, { from: 'D 隊', score: 8, comment: '替代方案比較比我們完整。' }, { from: 'E 隊', score: 8, comment: '缺少對員工端的溝通規劃。' }], bonusPoints: 0,
    fourD: { D1: 78, D2: 83, D3: 70, D4: 62 },
    stance: { ok: true, quote: '建議立即終止與現供應商的合約' },
    measures: { ok: true, quote: '要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次' },
    coverage: coverage([2, 1, 1, 0, 2, 0], { 0: '物流成本上升約 15%，前三個月', 1: '尚未評估員工與現有供應商窗口的關係', 2: '僅提出單一方案，與維持現狀對照不足', 4: '罰則承諾書與第三方稽核機制' }, [1]),
    bonusDims: [{ dim: '消費者輿情監測', reason: '官方清單外，說明輿情會直接影響品牌信任', active: true }],
    flags: [{ type: '無法確認', text: '更換供應商需要 4-6 週的過渡期', reason: '具體數字但未說明來源，待查證', penalty: 0, active: false, uncertain: true }],
    aiComment: '立場明確、財務量化具體（物流成本 +15%），倫理面向有第三方稽核機制。缺少執行時程與員工影響，替代方案只提出單一路徑。',
    finalVote: [
      { member: '陳阿哲', summary: '立即終止合約，改由新供應商簽附罰則的勞動承諾書，每季第三方稽核', voters: ['陳阿哲', '王品文'] },
      { member: '林雅婷', summary: '先更換供應商，但保留舊供應商 3 個月緩衝期', voters: ['林雅婷'] },
      { member: '王品文', summary: '先查證事實再決定是否終止合約', voters: [] },
    ],
    teacherNote: '財務量化清楚，方案本身也具體，但對員工端著墨較少。',
  },
  {
    id: 'B', name: 'B 隊', members: ['吳建宏', '張書豪'], peerRatings: [{ from: 'A 隊', score: 8, comment: '分階段稽核很穩健。' }, { from: 'C 隊', score: 7, comment: '替代方案比較清楚，但缺財務試算。' }, { from: 'D 隊', score: 8, comment: '方向合理，時程不夠明確。' }, { from: 'E 隊', score: 9, comment: '論述保守但務實。' }], bonusPoints: 0,
    fourD: { D1: 70, D2: 76, D3: 66, D4: 60 },
    stance: { ok: true, quote: '建議採取分階段稽核，暫不終止現有合約' },
    measures: { ok: true, quote: '先要求供應商提供近一年的勞檢紀錄，同步啟動備援供應商評估' },
    coverage: coverage([1, 0, 2, 0, 1, 1], { 0: '提到短期斷貨風險', 2: '明確比較「加強稽核」與「更換供應商」', 4: '視為違規的判定標準', 5: '分階段稽核的對外說法' }),
    bonusDims: [{ dim: '供應商違規紀錄查證', reason: '官方清單外，先查證事實再決定方案', active: true }],
    flags: [],
    aiComment: '方案務實但論述較保守，替代方案比較清楚，缺乏具體財務試算與執行時程。',
    finalVote: [
      { member: '吳建宏', summary: '分階段稽核，暫不終止合約，同步啟動備援供應商評估', voters: ['吳建宏', '張書豪'] },
      { member: '張書豪', summary: '直接更換供應商，降低輿情風險', voters: [] },
    ],
    teacherNote: '分階段稽核的想法穩健，建議下次補上財務面的量化。',
  },
  {
    id: 'C', name: 'C 隊', members: ['王志明', '劉亭慧'], peerRatings: [{ from: 'A 隊', score: 6, comment: '看得出來有想法，但解方還不完整。' }, { from: 'B 隊', score: 5, comment: '沒有明確立場。' }, { from: 'D 隊', score: 6, comment: '配套措施不足。' }, { from: 'E 隊', score: 5, comment: '有先釐清事實，值得肯定。' }], bonusPoints: 0,
    fourD: { D1: 55, D2: 58, D3: 40, D4: 45 },
    stance: { ok: false, quote: '' },
    measures: { ok: false, quote: '' },
    coverage: coverage([1, 0, 1, 0, 0, 0], { 0: '提到需要確認成本', 2: '有提出要先釐清事實' }),
    bonusDims: [],
    flags: [],
    aiComment: '本題因討論時間不足，未能產出完整解方；已有的對話聚焦在查證供應商是否違法，尚未形成立場與配套措施。',
    finalVote: [
      { member: '王志明', summary: '先查證供應商是否違法，再決定是否終止合約（尚未形成完整立場）', voters: ['王志明', '劉亭慧'] },
      { member: '劉亭慧', summary: '提出需要確認成本，但沒有具體方案', voters: [] },
    ],
    teacherNote: '提醒團隊先分配時間，再逐題推進，避免卡在單一問題。',
  },
  {
    id: 'D', name: 'D 隊', members: ['黃冠廷', '吳雅婷'], peerRatings: [{ from: 'A 隊', score: 8, comment: '分兩階段的做法不錯。' }, { from: 'B 隊', score: 7, comment: '數據來源要再查證。' }, { from: 'C 隊', score: 7, comment: '限期改善的想法務實。' }, { from: 'E 隊', score: 8, comment: '引用的統計數字讓人存疑。' }], bonusPoints: 0,
    fourD: { D1: 66, D2: 60, D3: 38, D4: 55 },
    stance: { ok: true, quote: '維持現供應商，但要求 30 天內提出改善計畫' },
    measures: { ok: true, quote: '加派稽核人力，期限內未改善才啟動備援供應商評估' },
    coverage: coverage([1, 0, 2, 0, 1, 1], { 0: '提到稽核人力成本', 2: '限期改善與啟動備援兩階段方案', 4: '裁罰風險', 5: '對供應商的溝通期限' }),
    bonusDims: [],
    flags: [{ type: '明確錯誤', text: '該產業平均違規率達 42%', reason: '查核後找不到原始來源，判定為虛構數據', penalty: 5, active: true, uncertain: false, dim: '替代方案比較' }],
    aiComment: '覆蓋面向不少，但引用「產業平均違規率 42%」經查核為虛構數據，已扣分；組員雖追問出處，仍保留在解方中。',
    finalVote: [
      { member: '黃冠廷', summary: '維持現供應商，30 天內提出改善計畫，期限內未改善才啟動備援', voters: ['黃冠廷', '吳雅婷'] },
      { member: '吳雅婷', summary: '直接啟動備援供應商評估，不給現供應商緩衝', voters: [] },
    ],
    teacherNote: '引用統計數字前務必要求 AI 附上來源，這次的幻覺陷阱是本堂課的重點教訓。',
  },
  {
    id: 'E', name: 'E 隊', members: ['許庭瑜', '林佳蓉'], peerRatings: [{ from: 'A 隊', score: 9, comment: '員工溝通與對外聲明都想到了。' }, { from: 'B 隊', score: 9, comment: '很完整，士氣面處理得細。' }, { from: 'C 隊', score: 10, comment: '兼顧內外部溝通。' }, { from: 'D 隊', score: 10, comment: '條件式方案很有彈性。' }], bonusPoints: 0,
    fourD: { D1: 74, D2: 81, D3: 72, D4: 66 },
    stance: { ok: true, quote: '優先與員工／客服代表溝通，再視稽核結果決定是否更換供應商' },
    measures: { ok: true, quote: '準備好對外聲明稿以因應媒體詢問' },
    coverage: coverage([2, 2, 1, 0, 2, 2], { 0: '以員工士氣流失成本估算', 1: '聚焦員工溝通與士氣風險', 2: '稽核後再決定的條件式方案', 4: '聲明稿要承認議題並公開結果', 5: '對外聲明稿與內部說明並行' }, [3]),
    bonusDims: [{ dim: '供應商違規紀錄查證', reason: '官方清單外，先確認事實再溝通', active: true }],
    flags: [],
    aiComment: '員工溝通與對外揭露都處理得很完整，是唯一同時兼顧內部士氣與外部聲明的隊伍；執行時程只有零星提到，評分 AI 在 0／1 之間不確定，建議覆核。',
    finalVote: [
      { member: '許庭瑜', summary: '先與員工／客服溝通，稽核後再決定是否更換，並備妥對外聲明稿', voters: ['許庭瑜', '林佳蓉'] },
      { member: '林佳蓉', summary: '優先準備對外聲明稿，其餘等稽核結果', voters: [] },
    ],
    teacherNote: '員工溝通面處理得非常細膩，是全班唯一同時兼顧內部士氣與對外聲明的隊伍。',
  },
]

/* finalVote：每位組員的候選答案摘要與票數（voters＝投給這份答案的組員，可以投自己）。
   得票最多的就是該隊的「最終回答」，AI 評分只針對這一份。同票時怎麼決定尚未定案。 */

/* peerRatings：別組（學生以小組身份）給這隊的互評分數與留言，滿分 10，總分用的是平均。 */

// 賽後亮點（取自各隊對話紀錄，之後由評分 AI 自動挑選）
export const RESULT_HIGHLIGHTS = [
  { key: 'prompt', icon: '✦', title: '最佳追問', team: 'A 隊', who: '陳阿哲', quote: '請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', reason: '指定角色、範圍與數量，D2 描述拿到滿分。' },
  { key: 'check', icon: '✓', title: '最強查核', team: 'D 隊', who: '吳雅婷', quote: '請說明剛剛 42% 這個數字的出處。', reason: '主動追問來源，讓 AI 承認無法提供，是本堂課最好的 D3 辨識示範。' },
  { key: 'unique', icon: '◆', title: '最獨特面向', team: 'A 隊', who: '消費者輿情監測', quote: '輿情會直接影響品牌信任，應納入監測指標。', reason: '官方清單外、全班只有 A 隊想到。' },
  { key: 'growth', icon: '↗', title: '最大進步', team: 'E 隊', who: 'AI 分數 61 → 83', quote: '第一則只問背景，後來改成分步驟、指定受眾與限制。', reason: '從單次提問進步到持續迭代，D1、D2 成長最明顯。' },
]

// 刪除分類時，裡面的題庫不會被刪掉，而是移到這個內建的「未分類」（只有裡面有題庫時才會顯示，不能自己刪除）
export const UNCATEGORIZED = { name: '未分類', tone: '#9AA0B3', tag: '尚未歸類的題庫' }

// 新增分類時可選的顏色
export const CATEGORY_COLORS = ['#3F97E0', '#E0709A', '#F0A030', '#35A97C', '#8B6BD6', '#E0584F', '#2BB3B1', '#7A8A9E']

