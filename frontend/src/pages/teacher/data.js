/*
  教師端原型（frontend/src/prototypes/教師端_最初版.js）裡寫死的假資料，
  搬過來這裡讓各畫面元件 import 使用。之後接後端 API 時，這個檔案可以
  直接被「打 API 拿資料」取代，畫面元件不用大改。
*/

/*
  課程（依 docs/system-flow.md 三「我的課程」）：
  必填：課程名稱 title、課程介紹 intro、公開／私人 visibility、人數限制 capacity、發布時間 publishAt；
  選填：結束時間 endAt（預設半年）、價錢 price、標籤 tags。
  joinCode 是學生用來加入的課程代碼；pending 是私人課程等待老師審核的加入申請；extraStudents 是老師後來新增或核准加入的學生。
  學生人數、競賽場次都只存數字，畫面上的文字由 courseLabels() 組出來。
*/
export const COURSES = [
  {
    id: 'c1', demoRoster: true, term: '114-1 學期', icon: 'grad', title: 'AI 提示工程與批判思考',
    intro: '以「商業兩難情境競技場」為核心教學工具，讓學生分組運用 AI 提示工程能力拆解真實商業決策難題。',
    schedule: '每週三 3-4 節', studentCount: 32, competitionCount: 3,
    visibility: 'public', capacity: 40, joinCode: 'K7Q2MX', pending: [], extraStudents: [],
  },
  {
    id: 'c2', demoRoster: true, term: '114-1 學期', icon: 'bars', title: '資訊管理專題研究',
    intro: '資訊管理專題的研究方法與實作，分組完成專題。',
    schedule: '每週五 6-7 節', studentCount: 18, competitionCount: 1,
    visibility: 'private', capacity: 30, joinCode: 'P4N8TD',
    pending: [
      { id: 'p1', name: '林芊妤', dept: '資管二', email: 's1101021@nccu.edu.tw' },
      { id: 'p2', name: '陳昱廷', dept: '企管三', email: 's1101022@nccu.edu.tw' },
    ],
    extraStudents: [],
  },
  {
    id: 'c3', demoRoster: true, term: '114 上 · 推廣班', icon: 'trend', title: '數位轉型與商業分析',
    intro: '推廣班課程，含在職人士，週末上課。',
    schedule: '週末班', studentCount: 45, studentNote: '（含在職人士）', competitionCount: 0,
    visibility: 'public', capacity: 60, joinCode: 'W9R3HF', pending: [], extraStudents: [],
  },
]

// 畫面上的文字（人數、競賽場次、課程頁標題下的說明）都由數字組出來，人數或場次變動時不用改文字
export function courseLabels(course) {
  const students = `${course.studentCount} 位學生${course.studentNote ?? ''}`
  return {
    students,
    competitions: course.competitionCount > 0 ? `已開設 ${course.competitionCount} 場競賽` : '尚未開設競賽',
    detailMeta: `${course.term} · ${students} · ${course.schedule}`,
    access: `${course.visibility === 'private' ? '私人課程（加入需審核）' : '公開課程'}・人數上限 ${course.capacity} 人`,
  }
}

// 課程代碼與加入連結、QR Code（學生用代碼或掃描加入課程）
export function courseJoinInfo(code) {
  const link = 'https://promptarena.app/course/' + code
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=' + encodeURIComponent(link)
  return { code, link, qrUrl }
}

export function generateCourseCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

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

// 發起競賽的預設值（依 docs/system-flow.md 六：預設二回合、每回合 20 分鐘，老師都可以調整）
export const DEFAULT_ROUNDS = 2
export const DEFAULT_TIME_LIMIT = 20
export const ROUND_LIMITS = { min: 1, max: 5, step: 1 }
export const TIME_LIMITS = { min: 5, max: 60, step: 5 }

// 每個題庫固定一個議題（議題、背景、任務），不分小題
export const FIXED_QUESTION_COUNT = 1

export const ROSTER = [
  { name: '劉孝慧', dept: '資管三', avg: '55%', attend: 12, email: 's1101001@nccu.edu.tw' },
  { name: '劉亭慧', dept: '資管三', avg: '61%', attend: 11, email: 's1101002@nccu.edu.tw' },
  { name: '林小薇', dept: '企管二', avg: '58%', attend: 12, email: 's1101003@nccu.edu.tw' },
  { name: '劉庭', dept: '資管三', avg: '44%', attend: 9, email: 's1101004@nccu.edu.tw' },
  { name: '劉美慧', dept: '財金三', avg: '52%', attend: 10, email: 's1101005@nccu.edu.tw' },
  { name: '劉婷婷', dept: '資管二', avg: '49%', attend: 12, email: 's1101006@nccu.edu.tw' },
  { name: '…', dept: '…', avg: '…', attend: '…', email: null },
]

// 每場競賽結束後，系統把這個題目的「平均、高標（第 75 百分位）、低標（第 25 百分位）、中位數、標準差」
// （四個維度分開，滿分 25）寫入課程資料庫，用來追蹤課程學生的 4D 能力成長（docs/scoring-design.md 四）
export const PAST_COMPETITIONS = [
  {
    id: 'pc1',
    title: '供應鏈勞動爭議',
    meta: '2026/09/16 · 5 隊參賽 · 冠軍：E 隊',
    fourD: { D1: { mean: 15.6, p75: 17.5, p25: 13.6, median: 15.4, sd: 2.8 }, D2: { mean: 17.4, p75: 19.2, p25: 15.5, median: 17.5, sd: 2.6 }, D3: { mean: 12.9, p75: 15.0, p25: 10.9, median: 12.7, sd: 2.9 }, D4: { mean: 12.3, p75: 14.5, p25: 10.2, median: 12.1, sd: 2.8 } },
    ranks: [
      { medal: 'gold', team: 'E 隊', members: '劉尹慧、劉昕慧、林庭慧' },
      { medal: 'silver', team: 'A 隊', members: '劉亭慧、劉曉慧、劉惠' },
      { medal: 'bronze', team: 'B 隊', members: '吳冠緯、劉傑米' },
    ],
  },
  {
    id: 'pc2',
    title: '外送勞權兩難',
    meta: '2026/06/12 · 6 隊參賽 · 冠軍：A 隊',
    fourD: { D1: { mean: 14.3, p75: 16.4, p25: 12.0, median: 14.2, sd: 3.0 }, D2: { mean: 15.9, p75: 18.0, p25: 13.4, median: 15.8, sd: 3.1 }, D3: { mean: 10.8, p75: 13.5, p25: 8.2, median: 10.6, sd: 3.1 }, D4: { mean: 10.2, p75: 12.6, p25: 7.9, median: 10.0, sd: 3.0 } },
    ranks: [
      { medal: 'gold', team: 'A 隊', members: '劉亭慧、劉曉慧' },
      { medal: 'silver', team: 'C 隊', members: '劉孝慧、劉庭' },
      { medal: 'bronze', team: 'D 隊', members: '劉美慧、劉婷婷' },
    ],
  },
  {
    id: 'pc3',
    title: '新創資源分配決策',
    meta: '2026/05/03 · 4 隊參賽 · 冠軍：A 隊',
    fourD: { D1: { mean: 13.1, p75: 15.5, p25: 10.8, median: 13.0, sd: 3.1 }, D2: { mean: 14.2, p75: 16.8, p25: 11.5, median: 14.0, sd: 3.4 }, D3: { mean: 9.6, p75: 12.1, p25: 7.0, median: 9.4, sd: 3.0 }, D4: { mean: 8.9, p75: 11.4, p25: 6.5, median: 8.7, sd: 3.2 } },
    ranks: [
      { medal: 'gold', team: 'A 隊', members: '劉亭慧、劉曉慧、劉惠' },
      { medal: 'silver', team: 'B 隊', members: '吳冠緯' },
      { medal: 'bronze', team: 'C 隊', members: '劉孝慧' },
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

/*
  監控台的隊伍：競賽中不做即時評分（docs/scoring-design.md 十一），所以沒有 AI 分數、即時 4D 與即時幻覺；
  覆蓋率不存在這裡，由 teamCoverage() 從即時知識地圖算；submitted／members 是已按「提交」的人數／組員人數
*/
export const TEAMS = [
  { name: 'A 隊', status: '已送出', dot: '#5FB894', question: 1, exchanges: 6, submitted: 3, members: 3, hinted: false, flags: [] },
  { name: 'B 隊', status: '討論中', dot: '#E7A857', question: 1, exchanges: 4, submitted: 1, members: 2, hinted: false, flags: [] },
  { name: 'C 隊', status: '停滯中', dot: '#C1495B', question: 1, exchanges: 2, submitted: 0, members: 2, hinted: true, flags: [{ t: '超過 90 秒無動作', c: 'amber' }], stalled: true },
  { name: 'D 隊', status: '已送出', dot: '#5FB894', question: 1, exchanges: 5, submitted: 2, members: 2, hinted: false, flags: [] },
  { name: 'E 隊', status: '討論中', dot: '#E7A857', question: 1, exchanges: 5, submitted: 1, members: 2, hinted: false, flags: [] },
]

// 監控台「即時動態」：初始幾筆（ago 為幾秒前）＋模擬新事件的候選池
// newDim ＝ 即時知識地圖出現新分支（面向偵測 AI 偵測到，只是談到，不代表加分；加分要等回合結束由評分 AI 確認）
export const INITIAL_LIVE_EVENTS = [
  { team: 'B 隊', kind: 'newDim', text: '可能的新面向「供應商違規紀錄查證」', ago: 8 },
  { team: 'A 隊', kind: 'newDim', text: '談到「倫理／法遵考量」', ago: 27 },
  { team: 'D 隊', kind: 'submitted', text: '全隊都已提交個人結果', ago: 52 },
  { team: 'C 隊', kind: 'hint', text: '教師已發送引導提示', ago: 95 },
  { team: 'E 隊', kind: 'newDim', text: '談到「員工／客戶影響評估」', ago: 131 },
  { team: 'A 隊', kind: 'redundant', text: '「財務影響量化」已談到過', ago: 168 },
  { team: 'D 隊', kind: 'newDim', text: '談到「溝通／揭露策略」', ago: 214 },
  { team: 'B 隊', kind: 'newDim', text: '談到「替代方案比較」', ago: 262 },
  { team: 'C 隊', kind: 'newDim', text: '談到「財務影響量化」', ago: 305 },
  { team: 'A 隊', kind: 'newDim', text: '談到「財務影響量化」', ago: 352 },
  { team: '全班', kind: 'hint', text: '競賽開始，已公布案例與規則', ago: 421 },
]

// 模擬面向偵測 AI 的批次結果（真實資料是每隊每 1～2 分鐘偵測一次）
export const LIVE_EVENT_POOL = [
  { team: 'B 隊', dim: '執行時程與風險', who: '劉傑米', answer: '更換供應商需要 4–6 週過渡期，期間要有備援方案' },
  { team: 'E 隊', dim: '倫理／法遵考量', who: '劉昕慧', answer: '確認供應商是否違反勞動法規，結果要對外公開' },
  { team: 'C 隊', dim: '員工／客戶影響評估', who: '劉庭', answer: '評估客服端會接到多少客訴，要先準備話術' },
  { team: 'A 隊', dim: '替代方案比較', who: '劉惠', answer: '補上與「維持現狀」的對照評估，不只看單一方案' },
  { team: 'D 隊', dim: '倫理／法遵考量', who: '劉美慧', answer: '把罰則與被裁罰的風險一併納入評估' },
  { team: 'C 隊', dim: '供應商財務體質查核', origin: 'team', who: '劉孝慧', answer: '查供應商的財務狀況，撐不撐得起改善計畫' },
  { team: 'A 隊', dim: '消費者輿情監測', origin: 'team', who: '劉亭慧', answer: '追蹤社群輿情，提早預警品牌信任下滑' },
]

/*
  隊伍詳情：finalAnswer 是組內匿名投票選出的那位組員的個人結果（該組員聊天室中的最終解方），不是 AI 整合的；
  投票完成前是 null。「已談到的面向」直接用即時知識地圖（KMAP_INITIAL）的資料，不另外存。
*/
export const TEAM_DETAIL = {
  'A 隊': {
    status: '已送出',
    finalAnswer: { who: '劉惠', votes: 2, totalVotes: 3, text: '建議一：立即終止與現供應商的合約，改與通過我們稽核標準的新供應商簽約。\n預估影響：前三個月因交接與磨合，物流成本上升約 15%，但可避免持續的勞動爭議聲量擴大。\n建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。\n風險：更換供應商本身需要 4-6 週的過渡期，這段期間可能出現交貨延遲。\n（本隊尚未評估員工與現有供應商窗口的關係維護，這部分後續需要 HR 與採購共同討論。）' },
  },
  'B 隊': { status: '討論中', finalAnswer: null },
  'C 隊': { status: '停滯中', finalAnswer: null },
  'D 隊': {
    status: '已送出',
    finalAnswer: { who: '劉美慧', votes: 2, totalVotes: 2, text: '建議：維持現供應商，但要求對方在 30 天內提出改善計畫，並加派稽核人力。\n根據我們查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決問題。\n若供應商未能在期限內改善，才考慮啟動備援供應商評估。' },
  },
  'E 隊': { status: '討論中', finalAnswer: null },
}

// 隊伍詳情的「對話紀錄」：每筆是某位組員送出的 prompt 與他自己的 AI 的回覆（競賽中不做即時評分與幻覺偵測，所以沒有標記）
export const TEAM_CHAT = {
  'A 隊': [
    { who: '劉亭慧', at: '02:10', prompt: '請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', reply: '三個月現金流影響：1. 交接與磨合期物流成本上升約 15%；2. 新供應商的稽核與簽約成本；3. 舊庫存處理。可能被低估的隱藏成本：品質磨合期的退貨率、緊急調貨的運費。' },
    { who: '劉曉慧', at: '03:25', prompt: '先幫我查一下這個供應商過去有沒有被開罰過。', reply: '我無法即時查詢特定供應商的裁罰紀錄，建議到勞動部公開的違規事業單位名單查證，我可以協助整理需要核對的欄位。' },
    { who: '劉惠', at: '05:02', prompt: '把前面兩位的重點整理成建議，要包含終止合約與第三方稽核。', reply: '建議一：終止現有合約，改與通過稽核標準的新供應商簽約。建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。' },
  ],
  'B 隊': [
    { who: '林庭慧', at: '02:48', prompt: '幫我比較維持現供應商加強稽核，跟直接換供應商，兩個方案的財務跟品牌風險。', reply: '維持現供應商：短期成本低、供應穩定，但品牌風險取決於改善成效；直接更換：成本與斷貨風險較高，但可向外界表明立場。建議以分階段稽核作為折衷。' },
    { who: '劉傑米', at: '04:30', prompt: '那分階段稽核的第一步要怎麼設計？', reply: '第一步可要求供應商提供近一年勞檢紀錄與改善計畫，設定 30 天期限，同時啟動備援供應商評估。' },
  ],
  'C 隊': [
    { who: '劉庭', at: '03:05', prompt: '這個供應商到底有沒有違反勞動法？幫我查一下。', reply: '我無法確認特定供應商是否違法，需以主管機關的查核結果為準。若要評估，可以先整理爆料內容、公司回應與已知的查核紀錄。' },
    { who: '劉孝慧', at: '04:12', prompt: '那我們先列出需要向供應商確認的問題。', reply: '可確認：工時紀錄、投保名冊、加班費計算方式、近期是否被勞檢，以及改善措施的時程。' },
  ],
  'D 隊': [
    { who: '劉美慧', at: '02:20', prompt: '幫我把裁罰風險跟產業違規率整理一下，維持現供應商但加強稽核的方案。', reply: '根據我查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決。' },
    { who: '劉婷婷', at: '03:40', prompt: '請說明剛剛 42% 這個數字的出處。', reply: '抱歉，我無法提供這個數字的可靠來源，建議不要直接引用，改以主管機關公布的統計為準。' },
    { who: '劉美慧', at: '05:15', prompt: '好，那把方案改成限期 30 天改善、未達標再啟動備援供應商。', reply: '方案：要求供應商 30 天內提出改善計畫並加派稽核；若期限內未改善，才啟動備援供應商評估。' },
  ],
  'E 隊': [
    { who: '劉尹慧', at: '02:35', prompt: '我們想先確認員工端的反應，幫我想一下要怎麼評估員工士氣風險。', reply: '可從三方面評估：現有員工對事件的觀感、與供應商窗口的合作關係是否受影響、對外溝通不一致造成的內部疑慮。' },
    { who: '劉昕慧', at: '04:05', prompt: '再幫我們擬一份對外聲明稿的重點。', reply: '重點：承認議題、說明正在查證、公布稽核時程、承諾結果公開，語氣避免推卸責任。' },
  ],
}

export const PUSH_SUGGESTIONS = [
  { key: 'viewpoint', label: '換視角引導卡：試著從另一個利害關係人角度提問', text: '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？' },
  { key: 'blank', label: '空白區域卡：提醒還沒被涵蓋的解方面向', text: '目前全班還沒有人談到「執行時程與風險」，這個面向可能有分數在等你們。' },
  { key: 'time', label: '節奏調整：全班加時 2 分鐘', text: '教師已為全班加時 2 分鐘，把握機會補齊還沒探索的面向。' },
]

// 集體知識地圖：teams 為已涵蓋該面向的隊伍代號；origin 'team' 表示隊伍自創、不在官方檢查清單內
/*
  集體知識地圖的節點（即時版，由面向偵測 AI 產生，只判斷「有沒有談到」、不是正式評分）：
  每個面向底下的 answers 是各隊在這個面向的一句代表摘要（哪位同學說了什麼），
  心智圖會把它畫成從面向長出去的分支。key 是隊伍代號 A～E。
*/
export const KMAP_INITIAL = [
  { dim: '財務影響量化', teams: ['A', 'B', 'C'], answers: {
    A: { who: '劉亭慧', text: '前三個月物流成本約上升 15%，並標出兩個被低估的隱藏成本' },
    B: { who: '林庭慧', text: '備援供應商報價比現行高約 8%，需要試算全年影響' },
    C: { who: '劉庭', text: '先確認更換的一次性轉換成本，再決定要不要換' },
  } },
  { dim: '員工／客戶影響評估', teams: ['A', 'D', 'E'], answers: {
    A: { who: '劉惠', text: '更換供應商期間，客服要先準備延遲出貨的說明' },
    D: { who: '劉婷婷', text: '加派稽核人力時，要評估對供應商員工的影響' },
    E: { who: '劉尹慧', text: '先與員工、客服代表溝通，估算士氣流失的成本' },
  } },
  { dim: '替代方案比較', teams: ['B', 'C', 'D'], answers: {
    D: { who: '劉美慧', text: '比較「限期改善」與「立即更換」兩個方案' },
    B: { who: '劉傑米', text: '比較「加強稽核」與「直接更換供應商」兩條路' },
    C: { who: '劉孝慧', text: '列出維持現狀、部分更換、全面更換三個選項' },
  } },
  { dim: '執行時程與風險', teams: [], answers: {} },
  { dim: '倫理／法遵考量', teams: ['A'], answers: {
    A: { who: '劉曉慧', text: '要求新供應商簽署附罰則的勞動條件承諾書' },
  } },
  { dim: '溝通／揭露策略', teams: ['A', 'D'], answers: {
    A: { who: '劉曉慧', text: '先擬好對外聲明，說明更換供應商的理由' },
    D: { who: '劉美慧', text: '給供應商 30 天改善期限，並準備好對外說法' },
  } },
  { dim: '供應商違規紀錄查證', teams: ['B', 'E'], origin: 'team', answers: {
    B: { who: '林庭慧', text: '先要求近一年的勞檢紀錄再下判斷' },
    E: { who: '劉昕慧', text: '先查證爆料是否屬實，再決定要不要對外聲明' },
  } },
]

// 覆蓋率 ＝ 這隊已談到的官方面向數 ÷ 官方面向總數（docs/scoring-design.md 十一：由後端用知識地圖資料計算，不另外呼叫 AI）
export function teamCoverage(nodes, letter) {
  const covered = nodes.filter((node) => node.origin !== 'team' && node.teams.includes(letter)).length
  return Math.round((covered / OFFICIAL_DIMS.length) * 100)
}

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
// 依 docs/scoring-design.md：
//   每回合小組分數 ＝ 解方分數（AI 評，0～100）＋ 組 4D 分數（組員個人 4D 的平均，0～100，四個維度各最高 25 分）
//   排名分數 ＝ 各回合小組分數的平均
//   最終排名分數 ＝ 排名分數 ＋ 老師調整（±10 分以內，理由必填，可以跳過）
// 互評是各組留給其他組的文字留言，不計分。
export const ADJUST_LIMIT = 10
export const DIM_4D_MAX = 25

export const OFFICIAL_DIMS = ['財務影響量化', '員工／客戶影響評估', '替代方案比較', '執行時程與風險', '倫理／法遵考量', '溝通／揭露策略']
export const DIM_4D = [
  { key: 'D1', label: '委託' },
  { key: 'D2', label: '描述' },
  { key: 'D3', label: '辨識' },
  { key: 'D4', label: '盡責' },
]

const coverage = (levels, quotes = {}, uncertain = []) =>
  OFFICIAL_DIMS.map((dim, i) => ({ dim, level: levels[i], quote: quotes[i] || '', uncertain: uncertain.includes(i) }))

// 每隊有多個回合（rounds，依序為第 1、2 回合）；每回合是「這回合組內投票選出的最終回答」被評分 AI 評出來的結果。
// level：0 沒提到、1 有提到但只是帶過、2 有具體做法或說明；bonusDims 是官方清單外的新面向（每個 +5，最多 +10）；
// fourD 是這回合組員個人 4D 的平均（每個維度 0～25，四個維度加起來滿分 100）；
// privacy 是盡-1 資安與隱私（只扣分，觸發一次盡責維度 −5）。這些都是 AI 的判斷，老師只看、不改，只在最後加減分。
export const RESULT_TEAMS = [
  {
    id: 'A', name: 'A 隊', members: ['劉亭慧', '劉曉慧', '劉惠'],
    rounds: [
      {
        finalAnswer: { member: '劉曉慧', summary: '先更換供應商，但保留舊供應商 3 個月緩衝期', votes: 2, totalVotes: 3 },
        stance: { ok: true, quote: '建議先更換供應商，但保留舊供應商 3 個月緩衝期' },
        measures: { ok: true, quote: '保留 3 個月緩衝期，期間雙供應商並行' },
        coverage: coverage([1, 0, 1, 0, 1, 0], { 0: '提到換供應商會增加成本', 2: '只提出單一方案', 4: '提到簽約條款' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 17, D2: 19, D3: 15, D4: 13 },
        aiComment: '立場明確，有具體的過渡做法，但面向偏少，財務與員工影響都只是帶過。',
      },
      {
        finalAnswer: { member: '劉亭慧', summary: '立即終止合約，改由新供應商簽附罰則的勞動承諾書，每季第三方稽核', votes: 2, totalVotes: 3 },
        stance: { ok: true, quote: '建議立即終止與現供應商的合約' },
        measures: { ok: true, quote: '要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次' },
        coverage: coverage([2, 1, 1, 0, 2, 0], { 0: '物流成本上升約 15%，前三個月', 1: '尚未評估員工與現有供應商窗口的關係', 2: '僅提出單一方案，與維持現狀對照不足', 4: '罰則承諾書與第三方稽核機制' }, [1]),
        bonusDims: [{ dim: '消費者輿情監測', reason: '官方清單外，說明輿情會直接影響品牌信任', active: true }],
        flags: [{ type: '無法確認', text: '更換供應商需要 4-6 週的過渡期', reason: '具體數字但未說明來源，待查證', penalty: 0, active: false, uncertain: true }],
        privacy: [],
        fourD: { D1: 20, D2: 21, D3: 17, D4: 16 },
        aiComment: '立場明確、財務量化具體（物流成本 +15%），倫理面向有第三方稽核機制。缺少執行時程與員工影響，替代方案只提出單一路徑。',
      },
    ],
    peerComments: [{ from: 'B 隊', comment: '提出的稽核機制很具體，執行時程可以再補。' }, { from: 'C 隊', comment: '財務量化清楚。' }, { from: 'D 隊', comment: '替代方案比較比我們完整。' }, { from: 'E 隊', comment: '缺少對員工端的溝通規劃。' }],
    teacherNote: '財務量化清楚，方案本身也具體，但對員工端著墨較少。', adjustment: 0, adjustReason: '',
  },
  {
    id: 'B', name: 'B 隊', members: ['林庭慧', '劉傑米'],
    rounds: [
      {
        finalAnswer: { member: '劉傑米', summary: '直接更換供應商，降低輿情風險', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '建議直接更換供應商' },
        measures: { ok: false, quote: '' },
        coverage: coverage([1, 0, 1, 0, 0, 1], { 0: '提到換供應商的成本', 2: '只比較了更換與維持', 5: '提到對外說明' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 15, D2: 17, D3: 14, D4: 13 },
        aiComment: '有明確立場，但沒有提出具體配套措施，面向也偏少。',
      },
      {
        finalAnswer: { member: '林庭慧', summary: '分階段稽核，暫不終止合約，同步啟動備援供應商評估', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '建議採取分階段稽核，暫不終止現有合約' },
        measures: { ok: true, quote: '先要求供應商提供近一年的勞檢紀錄，同步啟動備援供應商評估' },
        coverage: coverage([1, 0, 2, 0, 1, 1], { 0: '提到短期斷貨風險', 2: '明確比較「加強稽核」與「更換供應商」', 4: '視為違規的判定標準', 5: '分階段稽核的對外說法' }),
        bonusDims: [{ dim: '供應商違規紀錄查證', reason: '官方清單外，先查證事實再決定方案', active: true }],
        flags: [], privacy: [],
        fourD: { D1: 18, D2: 19, D3: 16, D4: 15 },
        aiComment: '方案務實但論述較保守，替代方案比較清楚，缺乏具體財務試算與執行時程。',
      },
    ],
    peerComments: [{ from: 'A 隊', comment: '分階段稽核很穩健。' }, { from: 'C 隊', comment: '替代方案比較清楚，但缺財務試算。' }, { from: 'D 隊', comment: '方向合理，時程不夠明確。' }, { from: 'E 隊', comment: '論述保守但務實。' }],
    teacherNote: '分階段稽核的想法穩健，建議下次補上財務面的量化。', adjustment: 0, adjustReason: '',
  },
  {
    id: 'C', name: 'C 隊', members: ['劉庭', '劉孝慧'],
    rounds: [
      {
        finalAnswer: { member: '劉庭', summary: '先查證供應商是否違法', votes: 2, totalVotes: 2 },
        stance: { ok: false, quote: '' },
        measures: { ok: false, quote: '' },
        coverage: coverage([0, 0, 1, 0, 0, 0], { 2: '提出要先釐清事實' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 11, D2: 13, D3: 9, D4: 10 },
        aiComment: '討論時間不足，只提出要先查證事實，沒有形成立場與配套。',
      },
      {
        finalAnswer: { member: '劉庭', summary: '先查證供應商是否違法，再決定是否終止合約（尚未形成完整立場）', votes: 2, totalVotes: 2 },
        stance: { ok: false, quote: '' },
        measures: { ok: false, quote: '' },
        coverage: coverage([1, 0, 1, 0, 0, 0], { 0: '提到需要確認成本', 2: '有提出要先釐清事實' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 13, D2: 14, D3: 10, D4: 11 },
        aiComment: '本題因討論時間不足，未能產出完整解方；已有的對話聚焦在查證供應商是否違法，尚未形成立場與配套措施。',
      },
    ],
    peerComments: [{ from: 'A 隊', comment: '看得出來有想法，但解方還不完整。' }, { from: 'B 隊', comment: '沒有明確立場。' }, { from: 'D 隊', comment: '配套措施不足。' }, { from: 'E 隊', comment: '有先釐清事實，值得肯定。' }],
    teacherNote: '提醒團隊先分配時間，再逐題推進，避免卡在單一問題。', adjustment: 0, adjustReason: '',
  },
  {
    id: 'D', name: 'D 隊', members: ['劉美慧', '劉婷婷'],
    rounds: [
      {
        finalAnswer: { member: '劉婷婷', summary: '直接啟動備援供應商評估，不給現供應商緩衝', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '建議直接啟動備援供應商評估' },
        measures: { ok: false, quote: '' },
        coverage: coverage([1, 0, 1, 0, 0, 1], { 0: '提到稽核人力成本', 2: '比較了兩個做法', 5: '提到溝通期限' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 15, D2: 14, D3: 8, D4: 13 },
        aiComment: '立場明確，但沒有提出具體配套，查證的部分也偏少。',
      },
      {
        finalAnswer: { member: '劉美慧', summary: '維持現供應商，30 天內提出改善計畫，期限內未改善才啟動備援', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '維持現供應商，但要求 30 天內提出改善計畫' },
        measures: { ok: true, quote: '加派稽核人力，期限內未改善才啟動備援供應商評估' },
        coverage: coverage([1, 0, 2, 0, 1, 1], { 0: '提到稽核人力成本', 2: '限期改善與啟動備援兩階段方案', 4: '裁罰風險', 5: '對供應商的溝通期限' }),
        bonusDims: [],
        flags: [{ type: '明確錯誤', text: '該產業平均違規率達 42%', reason: '查核後找不到原始來源，判定為虛構數據', penalty: 5, active: true, uncertain: false, dim: '替代方案比較' }],
        privacy: [],
        fourDUncertain: [{ indicator: '辨-1 查證事實', member: '劉美慧', evidence: '第 6 則對話', reason: '學生要求 AI 說明 42% 的出處，但之後沒有處理 AI 的回覆，在 1 和 2 之間猶豫，給了 1。' }],
        fourD: { D1: 17, D2: 15, D3: 9, D4: 14 },
        aiComment: '覆蓋面向不少，但引用「產業平均違規率 42%」經查核為虛構數據，已扣分；組員雖追問出處，仍保留在解方中。',
      },
    ],
    peerComments: [{ from: 'A 隊', comment: '分兩階段的做法不錯。' }, { from: 'B 隊', comment: '數據來源要再查證。' }, { from: 'C 隊', comment: '限期改善的想法務實。' }, { from: 'E 隊', comment: '引用的統計數字讓人存疑。' }],
    teacherNote: '引用統計數字前務必要求 AI 附上來源，這次的幻覺陷阱是本堂課的重點教訓。', adjustment: 0, adjustReason: '',
  },
  {
    id: 'E', name: 'E 隊', members: ['劉尹慧', '劉昕慧'],
    rounds: [
      {
        finalAnswer: { member: '劉昕慧', summary: '優先準備對外聲明稿，其餘等稽核結果', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '優先準備對外聲明稿，稽核結果出來再決定' },
        measures: { ok: false, quote: '' },
        coverage: coverage([1, 1, 1, 0, 1, 2], { 0: '提到員工士氣的成本', 1: '提到要跟員工溝通', 5: '對外聲明稿' }),
        bonusDims: [], flags: [], privacy: [],
        fourD: { D1: 16, D2: 18, D3: 15, D4: 14 },
        aiComment: '對外聲明準備得不錯，但內部溝通與配套都只是帶過。',
      },
      {
        finalAnswer: { member: '劉尹慧', summary: '先與員工／客服溝通，稽核後再決定是否更換，並備妥對外聲明稿', votes: 2, totalVotes: 2 },
        stance: { ok: true, quote: '優先與員工／客服代表溝通，再視稽核結果決定是否更換供應商' },
        measures: { ok: true, quote: '準備好對外聲明稿以因應媒體詢問' },
        coverage: coverage([2, 2, 1, 0, 2, 2], { 0: '以員工士氣流失成本估算', 1: '聚焦員工溝通與士氣風險', 2: '稽核後再決定的條件式方案', 4: '聲明稿要承認議題並公開結果', 5: '對外聲明稿與內部說明並行' }, [3]),
        bonusDims: [{ dim: '供應商違規紀錄查證', reason: '官方清單外，先確認事實再溝通', active: true }],
        flags: [],
        privacy: [{ member: '劉昕慧', text: '對話中貼了同學的手機號碼', reason: '出現可識別特定個人的聯絡方式，這位同學的盡責維度 −5 分' }],
        fourDUncertain: [{ indicator: '委-3 辨識不適合交給 AI 的任務', member: '劉尹慧', evidence: '第 3、5 則對話', reason: '學生先表達自己的立場再請 AI 補充，但最後立場與 AI 建議相同且沒說明理由，在 1 和 2 之間猶豫，給了 1。' }],
        fourD: { D1: 19, D2: 20, D3: 18, D4: 17 },
        aiComment: '員工溝通與對外揭露都處理得很完整，是唯一同時兼顧內部士氣與外部聲明的隊伍；執行時程只有零星提到，評分 AI 在 0／1 之間不確定，建議參考。',
      },
    ],
    peerComments: [{ from: 'A 隊', comment: '員工溝通與對外聲明都想到了。' }, { from: 'B 隊', comment: '很完整，士氣面處理得細。' }, { from: 'C 隊', comment: '兼顧內外部溝通。' }, { from: 'D 隊', comment: '條件式方案很有彈性。' }],
    teacherNote: '員工溝通面處理得非常細膩，是全班唯一同時兼顧內部士氣與對外聲明的隊伍。', adjustment: 0, adjustReason: '',
  },
]

/*
  4D 是每位組員各評一次（四個維度各 0～25），小組 4D ＝ 組員個人 4D 的平均。
  這裡的假資料只寫小組平均（fourD），再用下面兩個函式產生「每位組員的分數」與「每位組員每個維度的評語」，
  真實資料由評分 AI 輸出（每位學生各評一次：每個指標 0／1／2＋證據＋理由、每個維度一段評語）。
*/
function spreadMembers(names, dims) {
  const base = names.length === 3 ? [2, -1, -1] : names.length === 2 ? [1.5, -1.5] : names.map(() => 0)
  const result = {}
  names.forEach((name, i) => {
    result[name] = {}
    DIM_4D.forEach((dim, d) => {
      const offset = base[(i + d) % names.length]
      result[name][dim.key] = Math.max(0, Math.min(DIM_4D_MAX, dims[dim.key] + offset))
    })
  })
  return result
}

const DIM_COMMENTS = {
  D1: ['能把任務拆成幾個子問題分次處理，也持續帶入自己的想法；下次可以更主動地說明哪些部分由自己決定。', '有拆解任務，但後面的問題沒有建立在前面的回答上；可以先和 AI 討論分析的角度，再往下問。', '大多是直接要完整答案，較少拆解與帶入自己的判斷；建議先把題目拆成幾個子問題。'],
  D2: ['提示說明了背景與目的，也指定了格式與限制，AI 幾乎不用猜；可以再試試給範例讓輸出更貼近需求。', '有交代背景，但格式與限制比較籠統；可以更具體說明要幾點、給誰看。', '提示偏短，沒說明背景或要產出什麼；建議先交代情境與目的，再提出問題。'],
  D3: ['會要求出處、質疑推論，也指出了 AI 漏掉的面向，並且有據此修正；做得很好。', '有質疑過幾次，但多半停在「這確定嗎」，沒有針對具體說法追問；可以更具體。', '很少質疑或查證 AI 的說法，容易直接採用；建議對數字與引用要求出處。'],
  D4: ['整理結果前給了明確指示，提交前也檢查修改，並考慮了採用後的影響；做得很好。', '有檢查過最後的結果，但整理前沒有說明自己的決定；可以更明確表達取捨。', '直接請 AI 整理後就提交，較少檢查與評估後果；建議提交前自己讀過並修改。'],
}

function makeComments(dims) {
  const out = {}
  DIM_4D.forEach((dim) => {
    const v = dims[dim.key]
    out[dim.key] = DIM_COMMENTS[dim.key][v >= 18 ? 0 : v >= 13 ? 1 : 2]
  })
  return out
}

RESULT_TEAMS.forEach((team) => {
  team.rounds.forEach((round) => {
    round.memberFourD = spreadMembers(team.members, round.fourD)
    round.memberFourDComments = Object.fromEntries(Object.entries(round.memberFourD).map(([name, dims]) => [name, makeComments(dims)]))
    round.fourDUncertain = round.fourDUncertain ?? []
    // 最終回答全文：假資料是把評分 AI 引用的解方原文（立場、配套、各面向）串起來；真實資料是組內投票選出的那份完整解方
    const lines = []
    lines.push(round.stance.ok ? `立場：${round.stance.quote}` : '立場：（沒有形成明確立場）')
    if (round.measures.ok) lines.push(`配套措施：${round.measures.quote}`)
    round.coverage.filter((c) => c.quote && c.level > 0).forEach((c) => lines.push(`${c.dim}：${c.quote}`))
    round.bonusDims.filter((d) => d.active).forEach((d) => lines.push(`${d.dim}：${d.reason}`))
    round.flags.filter((f) => f.type !== '前後矛盾').forEach((f) => lines.push(`（解方中提到）${f.text}`))
    round.finalAnswer.lines = lines
  })
})

// 課程的小組名單：預設是系統隨機分組，內容跟競賽裡的假分組資料（RESULT_TEAMS）一致，分組資料只放一份
export const COURSE_GROUPS = RESULT_TEAMS.map((team) => ({ id: team.id, name: team.name, members: team.members }))

// 賽後亮點（取自各隊對話紀錄，之後由評分 AI 自動挑選）
export const RESULT_HIGHLIGHTS = [
  { key: 'prompt', icon: '✦', title: '最佳追問', team: 'A 隊', who: '劉亭慧', quote: '請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', reason: '指定角色、範圍與數量，D2 描述拿到滿分。' },
  { key: 'check', icon: '✓', title: '最強查核', team: 'D 隊', who: '劉婷婷', quote: '請說明剛剛 42% 這個數字的出處。', reason: '主動追問來源，讓 AI 承認無法提供，是本堂課最好的 D3 辨識示範。' },
  { key: 'unique', icon: '◆', title: '最獨特面向', team: 'A 隊', who: '消費者輿情監測', quote: '輿情會直接影響品牌信任，應納入監測指標。', reason: '官方清單外、全班只有 A 隊想到。' },
  { key: 'growth', icon: '↗', title: '最大進步', team: 'E 隊', who: 'AI 分數 61 → 83', quote: '第一則只問背景，後來改成分步驟、指定受眾與限制。', reason: '從單次提問進步到持續迭代，D1、D2 成長最明顯。' },
]

// 刪除分類時，裡面的題庫不會被刪掉，而是移到這個內建的「未分類」（只有裡面有題庫時才會顯示，不能自己刪除）
export const UNCATEGORIZED = { name: '未分類', tone: '#9AA0B3', tag: '尚未歸類的題庫' }

// 新增分類時可選的顏色
export const CATEGORY_COLORS = ['#3F97E0', '#E0709A', '#F0A030', '#35A97C', '#8B6BD6', '#E0584F', '#2BB3B1', '#7A8A9E']

