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

export const CASE_OPTIONS = [
  '供應鏈勞動爭議（已備妥完整示範資料）',
  '外送平台派單爭議（題庫建置中）',
  '新品定價兩難（題庫建置中）',
]

export const CASE_DEFAULTS = {
  '供應鏈勞動爭議（已備妥完整示範資料）': { time: 8 },
  '外送平台派單爭議（題庫建置中）': { time: 8 },
  '新品定價兩難（題庫建置中）': { time: 10 },
}

export const FIXED_ROUNDS = 3

export const ROSTER = [
  { name: '劉亭慧', dept: '資管三', avg: '55%', attend: 12 },
  { name: '陳阿哲', dept: '資管三', avg: '61%', attend: 11 },
  { name: '林小薇', dept: '企管二', avg: '58%', attend: 12 },
  { name: '王志明', dept: '資管三', avg: '44%', attend: 9 },
  { name: '黃冠廷', dept: '財金三', avg: '52%', attend: 10 },
  { name: '吳雅婷', dept: '資管二', avg: '49%', attend: 12 },
  { name: '…', dept: '…', avg: '…', attend: '…' },
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
    name: '供應鏈勞動爭議', diff: '黃金', industry: '電商 / 零售', source: 'sys', publish: 'public', rounds: 3, owner: '系統預設',
    bg: '「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。',
    roles: '財務長：認為更換供應商將墊高短期成本並影響出貨穩定\n永續長：主張若不處理將重創品牌信任度\n人資長：擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層',
    gap: '供應商是否已著手改善尚未證實；更換供應商的實際交接時程與品質風險未知。',
    tension: '短期成本與出貨穩定 vs 品牌信任與倫理責任',
    checklist: ['財務影響量化', '員工／客戶影響評估', '替代方案比較', '執行時程與風險', '倫理／法遵考量', '溝通／揭露策略'],
    trap: '該產業平均違規率達 42%（無查證來源，屬幻覺陷阱範例）',
  },
  {
    name: '外送平台派單爭議兩難', diff: '白銀', industry: '物流平台', source: 'sys', publish: 'public', rounds: 3, owner: '系統預設',
    bg: '「快送」是外送媒合平台，演算法派單以效率為核心指標，但外送員反映尖峰時段等待與超時罰款機制不合理，社群串連要求平台調整制度。',
    roles: '營運長：擔心調整演算法會拉長平均送達時間，影響用戶體驗\n外送員代表：要求透明化派單邏輯與合理的等待補償\n投資人：關注平台成長動能是否受影響',
    gap: '演算法實際邏輯屬商業機密，外部無法直接查核；外送員實際收入分布數據有限。',
    tension: '配送效率與平台成長 vs 外送員合理權益',
    checklist: ['派單機制透明度', '外送員收入影響評估', '替代方案比較', '執行時程與風險', '品牌與公關風險', '溝通／揭露策略'],
    trap: '外送員平均時薪較去年下降 30%（未經查證，屬幻覺陷阱範例）',
  },
  {
    name: '新品定價兩難', diff: '黃金', industry: '消費品', source: 'sys', publish: 'public', rounds: 3, owner: '系統預設',
    bg: '某消費品牌即將推出新品，行銷部主張以低價快速搶市佔，財務部則堅持高毛利定價以維持品牌形象與獲利結構，雙方在上市前僵持不下。',
    roles: '行銷副理：主張低價策略搶佔市佔率\n財務長：堅持高毛利定價，擔心低價傷害品牌定位\n業務經理：擔心通路對定價策略的接受度',
    gap: '競品實際成本結構未知；低價策略對長期品牌價值的影響難以量化。',
    tension: '短期市佔率 vs 長期品牌與獲利健康',
    checklist: ['市場定位分析', '成本結構評估', '替代方案比較（至少兩種定價策略）', '通路接受度評估', '長期品牌影響', '溝通／揭露策略'],
    trap: '競品毛利率僅 8%（未經查證，屬幻覺陷阱範例）',
  },
  {
    name: '團隊留任 vs 派遣轉正', diff: '白銀', industry: '人力資源', source: 'own', publish: 'private', rounds: 3, owner: '張欣綠（僅本人）',
    bg: '某部門有 5 名派遣人力已服務超過 2 年，部門主管希望轉正以留住熟練人力，但人事預算今年已被削減 15%，若全數轉正將排擠新進人力招募名額。',
    roles: '部門主管：希望轉正留住熟練人力\nHR：需在預算限制下平衡全公司人力配置\n派遣人力本人：期待穩定保障但尚未被告知決策方向',
    gap: '明年度預算是否會回升尚未確定；部分派遣人力是否有轉職意願未知。',
    tension: '留才穩定 vs 預算限制與公平性',
    checklist: ['預算影響量化', '員工士氣與留任率評估', '替代方案比較（部分轉正／分階段轉正）', '溝通與揭露策略'],
    trap: '（尚未標記已知幻覺陷阱）',
  },
]

export const TEAMS = [
  { name: 'A 隊', status: '已送出', dot: '#5FB894', cov: 64, flags: [] },
  { name: 'B 隊', status: '討論中', dot: '#E7A857', cov: 48, flags: [] },
  { name: 'C 隊', status: '停滯中', dot: '#C1495B', cov: 22, flags: [{ t: '超過 90 秒無動作', c: 'amber' }], stalled: true },
  { name: 'D 隊', status: '已評分', dot: '#5FB894', cov: 80, flags: [{ t: '命中幻覺陷阱', c: 'red' }], flagged: true },
  { name: 'E 隊', status: '已送出', dot: '#5FB894', cov: 56, flags: [] },
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
    solution: '（本隊在本回合送出提示前已超過時間上限，AI 尚未產出完整解方。）',
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

export const PUSH_SUGGESTIONS = [
  { key: 'viewpoint', label: '換視角引導卡：試著從另一個利害關係人角度提問', text: '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？' },
  { key: 'hallu', label: '幻覺警示卡：請 AI 說明數字是怎麼算出來的', text: 'AI 剛剛給的數字，你要不要請它說明這個數字是怎麼算出來的？' },
  { key: 'blank', label: '空白區域卡：提醒還沒被涵蓋的解方面向', text: '目前全班還沒有人談到「執行時程與風險」，這個面向可能有分數在等你們。' },
  { key: 'time', label: '節奏調整：全班加時 2 分鐘', text: '教師已為全班加時 2 分鐘，把握機會補齊還沒探索的面向。' },
]

export const CONSOLE_KMAP = [
  { dim: '財務影響量化', chips: [{ t: 'A', c: 'var(--d1)' }, { t: 'B', c: 'var(--d2)' }, { t: 'C', c: 'var(--d3)' }] },
  { dim: '員工／客戶影響評估', chips: [{ t: 'D', c: 'var(--d4)' }, { t: 'E', c: 'var(--team-e)' }] },
  { dim: '替代方案比較', chips: [{ t: 'B', c: 'var(--d2)' }, { t: 'C', c: 'var(--d3)' }] },
  { dim: '執行時程與風險', chips: [], empty: true },
  { dim: '倫理／法遵考量', chips: [{ t: 'A', c: 'var(--d1)' }] },
  { dim: '溝通／揭露策略', chips: [{ t: 'D', c: 'var(--d4)' }] },
]

export const GRADE_DATA = [
  { team: 'E 隊', peerAvg: 90, aiScore: 89, aiNote: '覆蓋率 88%（5/6 項），數據引用皆可查核，未命中幻覺陷阱。', teacherScore: 88, teacherNote: '員工溝通面處理得非常細膩，是全班唯一同時兼顧內部士氣與對外聲明的隊伍。', solution: TEAM_DETAIL['E 隊'].solution },
  { team: 'A 隊', peerAvg: 88, aiScore: 86, aiNote: '覆蓋率 67%（4/6 項），財務數字具體可查核，未命中已知幻覺陷阱。缺少「執行時程」與「員工影響」兩個面向。', teacherScore: 85, teacherNote: '財務量化清楚，方案本身也具體，但對員工端著墨較少。', solution: TEAM_DETAIL['A 隊'].solution },
  { team: 'B 隊', peerAvg: 82, aiScore: 85, aiNote: '覆蓋率 55%，方案務實但論述較保守，缺乏具體財務試算。', teacherScore: 83, teacherNote: '分階段稽核的想法穩健，建議下次補上財務面的量化。', solution: TEAM_DETAIL['B 隊'].solution },
  { team: 'C 隊', peerAvg: 86, aiScore: 81, aiNote: '覆蓋率 22%，本回合因討論時間不足未能產出完整解方。', teacherScore: 78, teacherNote: '財務量化清楚，但第 5 回合的倫理收斂稍嫌單薄，建議下次多引用具體利害關係人的觀點。', solution: TEAM_DETAIL['C 隊'].solution },
  { team: 'D 隊', peerAvg: 74, aiScore: 63, aiNote: '覆蓋率 71%，但引用「該產業平均違規率 42%」經查核為虛構數據，已扣分。', teacherScore: 65, teacherNote: '提醒團隊：引用統計數字前務必要求 AI 附上來源，這次的幻覺陷阱是本堂課的重點教訓。', solution: TEAM_DETAIL['D 隊'].solution },
]

export const FINAL_RANKING = [
  { rank: 1, team: 'E 隊', peer: 90, teacher: 88, ai: 89, total: 89.2 },
  { rank: 2, team: 'A 隊', peer: 88, teacher: 85, ai: 86, total: 87.1 },
  { rank: 3, team: 'B 隊', peer: 82, teacher: 83, ai: 85, total: 84.0 },
  { rank: 4, team: 'C 隊', peer: 86, teacher: 78, ai: 81, total: 76.5 },
  { rank: 5, team: 'D 隊', peer: 74, teacher: 65, ai: 63, total: 68.2 },
]

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
