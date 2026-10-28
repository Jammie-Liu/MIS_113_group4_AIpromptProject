/* ---------- practice problems (練習題，依難度分組，可自由選題) ---------- */
/* 從 frontend/src/prototypes/學生端/script.js 搬過來，內容與原型保持一致 */

export const DIM_NAMES = { d1: '委託', d2: '描述', d3: '辨識', d4: '盡責' };

export const TIERS = [
  { id: 'simple', label: '簡單', diffClass: 'bronze' },
  { id: 'medium', label: '中等', diffClass: 'silver' },
  { id: 'hard', label: '困難', diffClass: 'gold' },
];

export const TIER_UNLOCK_N = 2; // 示範用：完成前一難度幾題後解鎖下一難度
export const MAX_ROUNDS = 3; // 一題練習最多做幾個回合

export const PROBLEMS = {
  'p-intro': {
    tier: 'simple', title: '初探提問',
    scenario: '你剛開始接觸 AI 寫作小幫手。主管請你先練習最基本的提問技巧：請 AI 幫忙寫一段活動公告。',
    outcomeType: '一段活動公告文字',
    observation: '這一題會觀察：你有沒有在提示裡講清楚活動的基本資訊（時間、地點、對象），而不是只給一句模糊的指令。',
    indicators: [
      { id: 'i1', label: '活動資訊完整', dim: 'd2', base0: 1 },
      { id: 'i2', label: '指定格式／長度', dim: 'd2', base0: 0 },
      { id: 'i3', label: '留意讀者語氣', dim: 'd2', base0: 'unseen' },
    ],
    hints: [
      '先想想：這則公告的讀者是誰？時間、地點、對象你都講清楚了嗎？',
      '試試套用這個模板：「請幫我寫一則＿＿活動的公告，時間是＿＿、地點在＿＿，對象是＿＿，語氣要＿＿，用＿＿格式呈現。」',
      '完整範例：「請幫我寫一則系學會迎新茶會的活動公告，時間是 10/20（五）18:00，地點在系館中庭，對象是全系大一新生，<mark>語氣活潑親切一點</mark>，請用<mark>三到四行、附一個吸引人的標題</mark>。」',
    ],
  },
  'p-halluc': {
    tier: 'medium', title: '幻覺查核',
    scenario: 'AI 在回答你問題時引用了一個統計數字，但你不確定這個數字是真的還是 AI 自己編的。',
    outcomeType: '一段附查證要求的提示',
    observation: '這一題會觀察：你有沒有主動要求 AI 標示資料來源，或提醒自己要交叉核對數字的真實性。',
    indicators: [
      { id: 'i1', label: '要求標示來源', dim: 'd3', base0: 0 },
      { id: 'i2', label: '質疑推論邏輯', dim: 'd3', base0: 1 },
    ],
    hints: [
      '先想想：AI 給的數字，你要怎麼確認它不是編出來的？',
      '試試套用這個模板：「你剛剛提到的＿＿數字，請告訴我這是根據什麼資料來源？如果不確定，請直接說不確定，不要硬湊一個答案。」',
      '完整範例：「你剛剛提到『產業平均違規率 42%』，<mark>請告訴我這個數字的原始來源是什麼</mark>，<mark>如果你無法確定來源，請明講這是推測而不是事實</mark>，我會再自己查證。」',
    ],
  },
  bank1: {
    tier: 'simple', title: '會議效率提案',
    scenario: '你的部門想縮短每週例會時間，但不想犧牲重要討論品質。請 AI 幫忙發想至少兩個具體做法。',
    outcomeType: '至少兩個具體做法的提案',
    observation: '這一題會觀察：你的提示有沒有給 AI 足夠脈絡（目前會議多長、參加人數、常見討論主題），而不是只丟一句籠統的「幫我想辦法」。',
    indicators: [
      { id: 'i1', label: '脈絡完整', dim: 'd2', base0: 0 },
      { id: 'i2', label: '格式／限制', dim: 'd2', base0: 0 },
      { id: 'i3', label: '目標明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：你的部門目前開會多久、幾個人參加、常聊什麼？這些脈絡 AI 都不知道。',
      '試試套用這個模板：「我們部門目前每週例會＿＿分鐘、＿＿人參加，常花時間在＿＿。請提出至少兩個具體做法，能把會議縮短到＿＿分鐘以內，並列出優缺點。」',
      '完整範例：「我們部門目前每週例會 90 分鐘、10 人參加，常常花很多時間在單向報告。請 AI 提出至少兩個具體做法，能把會議縮短到 60 分鐘以內，同時保留重要討論的時間，<mark>並用條列式列出優缺點</mark>。」',
    ],
  },
  bank2: {
    tier: 'simple', title: '新人培訓方案',
    scenario: '公司想設計一套新人一週內能上手的訓練流程，請 AI 提出規劃架構。',
    outcomeType: '一週訓練計畫',
    observation: '這一題會觀察：有沒有指定新人背景／職位，避免 AI 給出過於籠統的訓練表。',
    indicators: [
      { id: 'i1', label: '脈絡完整', dim: 'd2', base0: 0 },
      { id: 'i2', label: '格式／限制', dim: 'd2', base0: 0 },
      { id: 'i3', label: '目標明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：這位新人是什麼職位、什麼部門？沒講清楚，AI 只能給很籠統的建議。',
      '試試套用這個模板：「我們要幫新加入的＿＿設計一週訓練計畫，請用＿＿的格式列出，每天包含＿＿。」',
      '完整範例：「我們要幫新加入的<mark>客服專員</mark>設計一週訓練計畫，<mark>請用每日行程表的格式列出</mark>，每天包含 1 個學習重點與 1 個實作練習。」',
    ],
  },
  bank3: {
    tier: 'medium', title: '內部獎勵制度',
    scenario: 'HR 想推出低成本但有感的員工獎勵方案，請 AI 發想三個可行方向。',
    outcomeType: '三個獎勵方案發想',
    observation: '這一題會觀察：你有沒有意識到「最終要不要採用」該由 HR 團隊決定，AI 只負責發想不做決策。',
    indicators: [
      { id: 'i1', label: '保留把關', dim: 'd1', base0: 0 },
      { id: 'i2', label: '能力判斷', dim: 'd1', base0: 0 },
      { id: 'i3', label: '目標明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：「哪個方案最好、就用哪個」這種決定，應該讓 AI 幫你拍板嗎？',
      '試試套用這個模板：「請發想三個＿＿方案，每個請標出＿＿，我會跟＿＿討論後再決定要採用哪一個。」',
      '完整範例：「幫我發想三個低成本但員工有感的獎勵方案，<mark>每個方案請標出可能需要的預算範圍與潛在風險</mark>，我會和 HR 團隊一起討論後<mark>再決定要採用哪一個</mark>。」',
    ],
  },
  bank5: {
    tier: 'medium', title: '跨部門溝通落差',
    scenario: '業務與工程部門常常資訊不同步，請 AI 提出一個低成本的溝通機制建議。',
    outcomeType: '一個溝通機制建議',
    observation: '這一題會觀察：有沒有讓 AI 了解問題實際發生在哪個環節，而不是憑空建議。',
    indicators: [
      { id: 'i1', label: '脈絡完整', dim: 'd2', base0: 0 },
      { id: 'i2', label: '格式／限制', dim: 'd2', base0: 0 },
      { id: 'i3', label: '目標明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：資訊不同步具體是發生在哪個環節？需求變更沒同步？進度看板沒更新？',
      '試試套用這個模板：「業務常常在＿＿後沒有即時同步給工程端，導致＿＿。請提出一個低成本的溝通機制建議，並列出至少兩個做法。」',
      '完整範例：「業務常常在需求變更後沒有即時同步給工程端，導致進度誤判。請 AI 提出一個低成本、不需要額外開會的溝通機制建議，<mark>用條列式列出至少兩個做法並說明適用情境</mark>。」',
    ],
  },
  complaint: {
    tier: 'hard', title: '客訴回覆信改寫',
    scenario: '你是行銷部窗口。一位顧客因物流延誤寫信抱怨，語氣強硬並要求全額退款。主管請你先請 AI 幫忙，把回覆信改得更專業、更能安撫顧客，同時你需要決定「退款與否」最終由誰拍板。',
    outcomeType: '一封給顧客的回覆信',
    observation: '這一題會觀察：你有沒有意識到「退款決策」不該完全交給 AI 自己決定。',
    indicators: [
      { id: 'i1', label: '範圍界定', dim: 'd2', base0: 2 },
      { id: 'i2', label: '能力判斷', dim: 'd1', base0: 0 },
      { id: 'i3', label: '保留把關', dim: 'd1', base0: 0 },
    ],
    hints: [
      '先想想：退款與否，是 AI 該直接幫你決定的事嗎？',
      '試試套用這個模板：「幫我把這封客訴信改得更專業、更能安撫顧客，<mark>但先不要承諾退款</mark>——請條列出幾個可能的處理方向，並標明哪些需要你自己再確認。」',
      '完整範例：「幫我把這封客訴信改得更專業、口氣更能安撫顧客，<mark>但先不要承諾退款</mark>——<mark>請條列出 2 個可能的處理方向</mark>（例如補償優惠券／加速換貨），<mark>並標明哪些是妳需要跟主管確認的部分</mark>，讓我最後自己決定要用哪一個。」',
    ],
  },
  ethics: {
    tier: 'hard', title: '方案裡的隱藏代價',
    scenario: 'AI 依你先前的提示，建議「裁減 10% 人力以降低成本」作為主要方案。這一題要練習如何用提示引導 AI，在維持方案可行性的同時，一併提出並評估這個方案對員工、品牌信任的倫理風險，並思考揭露策略。',
    outcomeType: '一份裁員方案的風險評估',
    observation: '這一題會觀察：你的提示有沒有主動要求 AI 揭露潛在倫理風險，而不是照單全收「裁員＝省成本」這個單一結論。',
    indicators: [
      { id: 'i1', label: '倫理風險意識', dim: 'd4', base0: 0 },
      { id: 'i2', label: '揭露誠實', dim: 'd4', base0: 0 },
      { id: 'i3', label: '格式明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：裁員對員工士氣、外部品牌信任會有什麼風險？這些 AI 主動提到了嗎？',
      '試試套用這個模板：「在維持成本目標的前提下，請先列出裁員方案對＿＿可能造成的風險，並提出至少一個能降低風險的溝通作法，最後才補充名單排序邏輯。」',
      '完整範例：「在維持成本目標的前提下，請AI先列出裁員方案<mark>對員工士氣、外部品牌信任可能造成的三個風險</mark>，並<mark>提出至少一個能降低這些風險的溝通／緩衝作法</mark>，最後才補充名單排序邏輯。」',
    ],
  },
  bank4: {
    tier: 'hard', title: '客服 SOP 優化',
    scenario: '客服團隊常常被同樣的問題卡住，請 AI 幫忙設計一份可以縮短處理時間的應對指南草案。',
    outcomeType: '一份客服應對指南草案',
    observation: '這一題會觀察：你有沒有要求 AI 標示哪些應對方式是「AI 自己推測」、哪些是有實際準則支持。',
    indicators: [
      { id: 'i1', label: '格式／限制', dim: 'd2', base0: 2 },
      { id: 'i2', label: '要求佐證', dim: 'd3', base0: 0 },
      { id: 'i3', label: '事後查核', dim: 'd3', base0: 0 },
    ],
    hints: [
      '先想想：AI 列出的應對方式，哪些是有準則支持、哪些只是它自己推測的？',
      '試試套用這個模板：「幫我草擬一份客服應對指南，針對常見問題列出建議回答，並請標明哪些是根據＿＿、哪些只是你的推測。」',
      '完整範例：「幫我草擬一份客服應對指南，針對常見問題列出建議回答，<mark>並請你標明哪些是根據一般客服準則、哪些只是你的推測</mark>——推測的部分我需要再跟資深客服確認過才會採用。」',
    ],
  },
  bank6: {
    tier: 'hard', title: '老字號手搖飲品牌轉型兩難',
    scenario: '「甜心堂」是經營 20 年的手搖飲連鎖品牌，全台有 120 家分店。近年手搖飲市場競爭激烈，年輕消費者轉向手作精品咖啡與低糖健康飲品，甜心堂的營收連續三年下滑。行銷部提出「全面轉型健康低糖路線」，但研發與供應鏈需要至少 8 個月才能完成配方與供應商調整；財務部則擔心轉型期間流失既有重糖客群，導致現金流吃緊。你是策略顧問，需要用 AI 協助評估這個轉型決策。任務：請 AI 幫你評估「全面轉型」與「漸進式雙軌並行」兩個路線的優劣，並指出至少一個你認為 AI 分析中可能忽略的風險。',
    outcomeType: '一份轉型路線評估',
    observation: '這一題會觀察：你的提示有沒有要求 AI 同時考慮短期現金流與長期品牌定位兩個時間尺度，而不是只回答其中一個。',
    indicators: [
      { id: 'i1', label: '脈絡完整', dim: 'd2', base0: 0 },
      { id: 'i2', label: '格式／限制', dim: 'd2', base0: 0 },
      { id: 'i3', label: '要求查核', dim: 'd3', base0: 0 },
    ],
    hints: [
      '先想想：題目給的關鍵限制（8 個月轉型期、既有客群流失風險）你有帶進提示裡嗎？',
      '試試套用這個模板：「甜心堂考慮轉型健康低糖路線，但研發需要＿＿、轉型期間可能流失＿＿。請比較兩個路線的優劣，並指出你的分析中有哪些是基於假設、可能被我忽略的風險。」',
      '完整範例：「甜心堂手搖飲品牌考慮轉型健康低糖路線，但研發需要 8 個月、轉型期間可能流失既有重糖客群。請比較『全面轉型』與『漸進式雙軌並行』兩個路線的優劣，<mark>並明確指出你的分析中有哪些是基於假設、可能被我忽略的風險</mark>，最後我會再跟財務與行銷團隊一起討論定案。」',
    ],
  },
  bank7: {
    tier: 'hard', title: '新創公司募資兩難',
    scenario: '一家 B2B SaaS 新創目前月營收成長穩定，但現金僅夠再撐 4 個月。天使輪投資人願意加碼，但要求提高持股比例並取得董事會否決權；同時有一家策略型企業客戶提出併購意向，估值略低於天使輪但可立即解決現金危機並綁定大客戶。你是創辦人的顧問，要協助評估。任務：請 AI 分析「接受加碼但讓出否決權」與「被併購」兩個選項對公司長期自主性與團隊的影響，並要求 AI 標示它無法確定的變數。',
    outcomeType: '一份兩個選項的比較分析',
    observation: '這一題會觀察：你有沒有意識到「最終決定該由創辦人與董事會決定」，AI 只能輔助分析不能替你做決定；以及有沒有要求 AI 標示它無法確定的變數。',
    indicators: [
      { id: 'i1', label: '保留把關', dim: 'd1', base0: 0 },
      { id: 'i2', label: '要求標示不確定性', dim: 'd3', base0: 0 },
      { id: 'i3', label: '目標明確', dim: 'd2', base0: 2 },
    ],
    hints: [
      '先想想：「該選哪個」這個最終決定，是該讓 AI 替你拍板的事嗎？',
      '試試套用這個模板：「請分析＿＿與＿＿這兩個選項，對公司長期自主性與團隊的影響，並標示出哪些是你無法確定、需要我再確認的變數。」',
      '完整範例：「請分析『接受天使輪加碼但讓出董事會否決權』與『被策略型企業併購』這兩個選項，對公司長期自主性與團隊的影響，<mark>並標示出哪些是你無法確定、需要我再跟董事會確認的變數</mark>——最終決定我會跟共同創辦人一起討論後再拍板。」',
    ],
  },
};

/* ---------- 指標主檔：每個行為的固定說明（定義＋好例子＋壞例子），給「什麼是這個？」用 ---------- */
export const INDICATOR_INFO = {
  '活動資訊完整': { def: '有沒有把活動的時間、地點、對象等基本資訊講清楚。', good: '「時間是 10/20（五）18:00，地點在系館中庭，對象是大一新生。」', bad: '「幫我寫一則活動公告。」（完全沒有細節）' },
  '指定格式／長度': { def: '有沒有指定成果要用什麼格式或多長。', good: '「請用三到四行，附一個吸引人的標題。」', bad: '完全沒提格式或長度，讓 AI 自由發揮。' },
  '留意讀者語氣': { def: '有沒有考慮到讀者是誰、該用什麼語氣寫。', good: '「對象是大一新生，語氣要活潑親切一點。」', bad: '沒有提到讀者是誰或該用什麼語氣。' },
  '要求標示來源': { def: '有沒有要求 AI 說明數字或資料的來源。', good: '「這個數字的原始來源是什麼？」', bad: '直接採信 AI 給的數字，不追問來源。' },
  '質疑推論邏輯': { def: '有沒有對 AI 的推論或結論提出合理的懷疑。', good: '「如果你不確定，請直接說不確定，不要硬湊答案。」', bad: '照單全收 AI 的說法，不多問一句。' },
  '脈絡完整': { def: '有沒有給 AI 足夠的背景資訊（現況、限制、規模等）。', good: '「目前每週例會 90 分鐘、10 人參加。」', bad: '「幫我想辦法讓開會變快一點。」（沒有任何背景）' },
  '格式／限制': { def: '有沒有要求輸出成特定格式，或限制數量、範圍。', good: '「請用條列式列出優缺點。」', bad: '沒有限制格式，AI 想怎麼回答都行。' },
  '目標明確': { def: '有沒有把想達成的目標講清楚。', good: '「縮短到 60 分鐘以內，同時保留重要討論時間。」', bad: '「讓會議變快一點。」（目標模糊）' },
  '保留把關': { def: '有沒有把最終決定權留給自己，而不是讓 AI 直接拍板。', good: '「列出方案和風險，我會再跟團隊討論後決定。」', bad: '「告訴我哪個最好，我們就用哪個。」' },
  '能力判斷': { def: '有沒有意識到這個決定不該完全交給 AI。', good: '「退款與否我需要再跟主管確認。」', bad: '讓 AI 直接決定要不要退款、退多少。' },
  '要求佐證': { def: '有沒有要求 AI 說明建議的依據來源。', good: '「請標明哪些有準則支持、哪些只是推測。」', bad: '直接採用 AI 的建議，不問依據是什麼。' },
  '事後查核': { def: '有沒有對 AI 生成的內容進一步提出質疑或要求驗證。', good: '「推測的部分我會再跟資深同事確認過才採用。」', bad: '收到回答後直接拿去用，不再查核。' },
  '要求查核': { def: '有沒有要求 AI 指出分析中可能忽略的風險或假設。', good: '「請指出你分析中有哪些是基於假設、可能被忽略的風險。」', bad: '只看結論，不問背後的假設是什麼。' },
  '範圍界定': { def: '有沒有清楚說明這次要 AI 做什麼、不做什麼。', good: '「先改語氣就好，不要承諾退款。」', bad: '沒有界定範圍，讓 AI 自己決定做到哪裡。' },
  '倫理風險意識': { def: '有沒有主動要求 AI 評估方案的倫理或風險影響。', good: '「請列出對員工士氣、品牌信任可能造成的風險。」', bad: '只看成本，沒想到對員工或社會的影響。' },
  '揭露誠實': { def: '有沒有考慮後續要怎麼向利害關係人溝通或揭露這個決策。', good: '「請提出一個能降低風險的溝通或緩衝作法。」', bad: '沒有想過要怎麼對外說明這個決策。' },
  '格式明確': { def: '有沒有具體要求輸出的格式或結構。', good: '「請列出名單排序的邏輯。」', bad: '沒有要求任何具體格式。' },
  '要求標示不確定性': { def: '有沒有要求 AI 標示它無法確定的部分。', good: '「請標示出哪些是你無法確定、需要我再確認的變數。」', bad: '把 AI 的推測當成確定的事實直接採用。' },
};

export function indicatorInfoFor(label) {
  return INDICATOR_INFO[label] || { def: '這個行為還沒有登錄說明。', good: '—', bad: '—' };
}

export const HINT_LEVEL_LABELS = ['提醒要考慮什麼', '帶空格的模板', '完整範例'];

/* ---------- content moderation (profanity check on any free-text field) ---------- */
export const BANNED_WORDS = ['幹你', '他媽的', '三小', '白癡', '智障', '去死', '賤人', '混蛋', '婊子'];
export function containsBannedWord(text) {
  return BANNED_WORDS.some((w) => text.includes(w));
}

/* ---------- practice state (per-problem, kept at StudentApp level) ---------- */
export function freshPracticeState() {
  return {
    status: 'not-started', round: 1, roundEnded: false, endedBy: null,
    messages: [], userMsgCountThisRound: 0, hintRevealed: false, hintLevelOpen: 0,
    aiSuggestDismissedThisRound: false, roundsHistory: [], resultOpen: {},
  };
}

export function getPracticeState(practiceState, id) {
  return practiceState[id] || freshPracticeState();
}

export function completedCountInTier(practiceState, tierId) {
  return Object.keys(PROBLEMS).filter(
    (id) => PROBLEMS[id].tier === tierId && getPracticeState(practiceState, id).status === 'completed'
  ).length;
}

export function isTierUnlocked(practiceState, tierId) {
  if (tierId === 'simple') return true;
  if (tierId === 'medium') return completedCountInTier(practiceState, 'simple') >= TIER_UNLOCK_N;
  if (tierId === 'hard') return completedCountInTier(practiceState, 'medium') >= TIER_UNLOCK_N;
  return true;
}

export function isProblemClickable(practiceState, id) {
  return isTierUnlocked(practiceState, PROBLEMS[id].tier);
}

/* 依難度（簡單→中等→困難）＋題目原本的順序排成一整串，作為「前往下一題」的依據 */
export function allProblemIdsInOrder() {
  let ids = [];
  TIERS.forEach((tier) => { ids = ids.concat(Object.keys(PROBLEMS).filter((id) => PROBLEMS[id].tier === tier.id)); });
  return ids;
}

/* 首頁「接續上一次的練習」按鈕：連到使用者離開前最後做的那一題 */
export function continuePracticeProblemId(practiceState, currentProblemId) {
  if (currentProblemId && PROBLEMS[currentProblemId]) return currentProblemId;
  const inProgress = Object.keys(PROBLEMS).find((id) => getPracticeState(practiceState, id).status === 'in-progress');
  if (inProgress) return inProgress;
  return Object.keys(PROBLEMS)[0];
}

/* ---------- scoring ---------- */
export function indicatorScoreForRound(ind, round) {
  if (ind.base0 === 'unseen') {
    if (round <= 1) return 'unseen';
    if (round === 2) return 1;
    return 2;
  }
  return round === 1 ? ind.base0 : 2;
}

export function computeRoundResult(problem, round, evidenceMsgIndex) {
  const indicatorResults = problem.indicators.map((ind) => ({
    id: ind.id, label: ind.label, dim: ind.dim,
    score: indicatorScoreForRound(ind, round), evidenceMsgIndex,
  }));
  const scored = indicatorResults.filter((r) => r.score !== 'unseen');
  const completed = scored.length > 0 && scored.every((r) => r.score === 2);
  const unmet = scored.filter((r) => r.score < 2).map((r) => r.label);
  return { round, indicatorResults, completed, unmet };
}

export function dimFeedbackText(dimKey, scores) {
  const vals = scores.filter((s) => typeof s === 'number');
  if (vals.length === 0) return '這一題這回合還沒有機會展現「' + DIM_NAMES[dimKey] + '」向度的行為。';
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (avg >= 2) return '「' + DIM_NAMES[dimKey] + '」這個向度這回合掌握得不錯，繼續保持。';
  if (avg >= 1) return '「' + DIM_NAMES[dimKey] + '」這個向度這回合有抓到一部分重點，但還可以更具體一點，可以參考提示區的做法。';
  return '「' + DIM_NAMES[dimKey] + '」這個向度這回合還沒有明顯展現，建議打開提示區看看可以怎麼調整提示。';
}

export function indicatorBadgeInfo(score) {
  if (score === 'unseen') return { cls: 'unseen', text: '未觀察到' };
  if (score === 2) return { cls: 's2', text: '做到了' };
  if (score === 1) return { cls: 's1', text: '部分做到' };
  return { cls: 's0', text: '還沒做到' };
}

export function indicatorReasonText(score) {
  if (score === 'unseen') return '這個回合還沒出現機會展現這項行為。';
  if (score === 2) return '這個回合的提示有清楚做到這一點。';
  if (score === 1) return '這個回合有稍微提到，但還不夠具體或完整。';
  return '這個回合的提示還沒有做到這一點。';
}

/* ---------- AI reply demo（前端示範用固定文字，正式串接 AI 後會依實際輸入即時生成） ---------- */
export function generateAIReply(problem, isFirstInRound) {
  if (isFirstInRound) {
    return '（示範用 AI 回覆）好的，這是我根據你的提示整理的' + problem.outcomeType + '草稿。（提醒：這是前端示範用的固定文字，正式串接 AI 後會依你的實際輸入即時生成。）';
  }
  return '（示範用 AI 回覆）已經根據你的補充調整如上。（同樣是示範用的固定文字，正式版會依對話內容即時生成。）';
}

/* 回合 2 以後，每則 AI 回覆模擬偵測一個還沒出現過的行為（不打分，只用於即時標籤） */
export function pickLiveTag(problem, messages) {
  const detected = new Set(messages.filter((m) => m.liveTag).map((m) => m.liveTag.label));
  const next = problem.indicators.find((ind) => !detected.has(ind.label));
  return next ? { label: next.label, dim: next.dim } : null;
}

/* ---------- practice state transitions（純函式，操作單一題目的 state） ---------- */
export function doRestart(state) {
  return { ...state, messages: [], userMsgCountThisRound: 0, aiSuggestDismissedThisRound: false };
}

function withRoundEndStatus(state, result) {
  if (result.completed) return { ...state, status: 'completed' };
  if (state.status === 'not-started') return { ...state, status: 'in-progress' };
  return state;
}

export function advanceRound(state, revealHint) {
  return {
    ...state,
    round: state.round + 1,
    roundEnded: false,
    endedBy: null,
    messages: [],
    userMsgCountThisRound: 0,
    aiSuggestDismissedThisRound: false,
    status: state.status !== 'completed' ? 'in-progress' : state.status,
    hintRevealed: revealHint ? true : state.hintRevealed,
    hintLevelOpen: revealHint ? Math.max(state.hintLevelOpen, 1) : state.hintLevelOpen,
  };
}

export function endRoundViaHint(state, problem) {
  const evidenceIdx = state.messages.findIndex((m) => m.role === 'user');
  const result = computeRoundResult(problem, state.round, evidenceIdx >= 0 ? evidenceIdx : null);
  const roundsHistory = [...state.roundsHistory, { ...result, endedBy: 'hint', hidden: true, transcript: state.messages.slice() }];
  const next = withRoundEndStatus({ ...state, roundsHistory }, result);
  return advanceRound(next, true);
}

export function revealHintInPlace(state) {
  return { ...state, hintRevealed: true, hintLevelOpen: Math.max(state.hintLevelOpen, 1) };
}

export function revealNextHintLevel(state, problem) {
  if (state.hintLevelOpen < problem.hints.length) {
    return { ...state, hintLevelOpen: state.hintLevelOpen + 1 };
  }
  return state;
}

export function submitResult(state, problem, submittedText) {
  const evidenceIdx = state.messages.findIndex((m) => m.role === 'user');
  const result = computeRoundResult(problem, state.round, evidenceIdx >= 0 ? evidenceIdx : null);
  const roundsHistory = [...state.roundsHistory, { ...result, endedBy: 'submit', hidden: false, submittedText, transcript: state.messages.slice() }];
  const next = withRoundEndStatus({ ...state, roundsHistory, roundEnded: true, endedBy: 'submit' }, result);
  return next;
}

export function pushUserAndPending(state, text) {
  const messages = [...state.messages, { role: 'user', text }, { role: 'ai', text: '思考中…', pending: true }];
  return { ...state, messages, userMsgCountThisRound: state.userMsgCountThisRound + 1 };
}

export function resolveAIReply(state, problem, pendingIndex, isFirstInRound, demoFailureAlreadyShown) {
  const messages = state.messages.slice();
  const msg = messages[pendingIndex];
  if (!msg) return state;
  if (!demoFailureAlreadyShown) {
    messages[pendingIndex] = { ...msg, pending: false, failed: true, text: '（示範用）這次 AI 回覆沒有成功，請重試。' };
  } else {
    const liveTag = state.round >= 2 ? pickLiveTag(problem, messages) : null;
    messages[pendingIndex] = {
      ...msg, pending: false, failed: false, text: generateAIReply(problem, isFirstInRound),
      ...(liveTag ? { liveTag } : {}),
    };
  }
  return { ...state, messages };
}

export function retryMessageStart(state, idx) {
  const messages = state.messages.slice();
  messages[idx] = { ...messages[idx], pending: true, failed: false, text: '思考中…' };
  return { ...state, messages };
}

export function retryMessageResolve(state, problem, idx) {
  const messages = state.messages.slice();
  const msg = messages[idx];
  if (!msg) return state;
  const liveTag = state.round >= 2 ? pickLiveTag(problem, messages) : null;
  messages[idx] = {
    ...msg, pending: false, failed: false, text: generateAIReply(problem, idx <= 1),
    ...(liveTag ? { liveTag } : {}),
  };
  return { ...state, messages };
}

/* ---------- 示範用初始進度（讓首頁一開始就有「已完成」與「進行中」各種狀態可看） ---------- */
export function seedDemoProgress() {
  const practiceState = {};
  ['bank1', 'bank2'].forEach((id) => {
    const problem = PROBLEMS[id];
    let st = freshPracticeState();
    st.round = 2; st.roundEnded = true; st.endedBy = 'submit';
    st.hintRevealed = true; st.hintLevelOpen = 1;
    st.messages = [
      { role: 'user', text: '（示範資料）這是我練習時送出的提示。' },
      { role: 'ai', text: generateAIReply(problem, true) },
    ];
    const round2Result = computeRoundResult(problem, 2, 0);
    st.roundsHistory = [
      { ...computeRoundResult(problem, 1, 0), endedBy: 'hint', hidden: true, transcript: [
        { role: 'user', text: '（示範資料）這是我在回合 1 送出的提示。' },
        { role: 'ai', text: '（示範資料）AI 在回合 1 的回覆。' },
      ] },
      { ...round2Result, endedBy: 'submit', hidden: false, submittedText: '（示範資料）已提交成果', transcript: st.messages.slice() },
    ];
    st.status = round2Result.completed ? 'completed' : 'in-progress';
    practiceState[id] = st;
  });

  const id = 'p-intro';
  const problem = PROBLEMS[id];
  let st = freshPracticeState();
  st.round = 2; st.roundEnded = false; st.endedBy = null;
  st.hintRevealed = true; st.hintLevelOpen = 1;
  st.messages = [
    { role: 'user', text: '請幫我寫一則系學會活動的公告。' },
    { role: 'ai', text: generateAIReply(problem, true) },
  ];
  st.userMsgCountThisRound = 1;
  st.roundsHistory = [
    { ...computeRoundResult(problem, 1, 0), endedBy: 'hint', hidden: true, transcript: [
      { role: 'user', text: '（示範資料）這是我在回合 1 送出的提示。' },
      { role: 'ai', text: '（示範資料）AI 在回合 1 的回覆。' },
    ] },
  ];
  if (st.status === 'not-started') st.status = 'in-progress';
  practiceState[id] = st;

  return practiceState;
}

/* ---------- 個人資料／設定（demo 用的個人資訊，目前只存在前端 state，沒有後端） ---------- */
export const MY_STUDENT_ID = '109XXXXX';
export const DEFAULT_MY_NAME = '劉亭慧';
export const DEFAULT_MY_EMAIL = 'tinghui.liu@example.edu.tw';
export const MY_SCORES = { d1: 52, d2: 71, d3: 38, d4: 60 };
export const MY_PRACTICE_SUMMARY = '已完成 4 關，平均 51 分';
export const MY_COMPETITION_SUMMARY = '參加 2 場競賽，最佳名次第 1 名';

export const DEFAULT_VISIBILITY = {
  studentId: true, email: false, bio: true, d4: true, practice: false, competition: true,
};

export const PRACTICE_STATUS_LABEL = { 'in-progress': '進行中', completed: '已完成' };

/* ---------- 我的課程／同學名單／教師（demo 用的課程與人員資料） ---------- */
export const COURSES = [
  { id: 'c1', name: 'AI 提示工程與批判思考', teacherIds: ['t1', 't2'], schedule: '週三 3-4 節', activeArenas: [
    { id: 'a1', title: '供應鏈勞動爭議', status: '進行中 · 第 3 小題（共 3 題）' },
  ] },
  { id: 'c2', name: '資訊管理專題研究', teacherIds: ['t3'], schedule: '週五 6-7 節', activeArenas: [] },
];

export const TEACHERS = {
  t1: { id: 't1', name: '王老師', title: '副教授', dept: '資訊管理學系', email: 'wang@example.edu.tw' },
  t2: { id: 't2', name: '李老師', title: '教授', dept: '資訊管理學系', email: 'li@example.edu.tw' },
  t3: { id: 't3', name: '陳老師', title: '助理教授', dept: '企業管理學系', email: 'chenprof@example.edu.tw' },
};

/* 這個使用者「沒有」修課的課程：只用來示範教師詳情「開過的課程」點進去但沒有權限瀏覽/加入的情況 */
export const COURSES_NOT_MINE = [
  { id: 'c3', name: '資料庫系統設計', teacherIds: ['t1'], schedule: '週二 7-8 節', activeArenas: [
    { id: 'a2', title: '資料庫正規化兩難', status: '進行中 · 第 1 小題（共 2 題）' },
  ] },
  { id: 'c4', name: '批判思考與寫作', teacherIds: ['t2'], schedule: '已於 2026 年上學期結束', activeArenas: [] },
];

export function allCoursesList() { return COURSES.concat(COURSES_NOT_MINE); }
export function findCourseById(id) { return allCoursesList().find((c) => c.id === id); }
export function isMyCourse(id) { return COURSES.some((c) => c.id === id); }

export const CLASSMATES = {
  c1: [
    { id: 'self', isSelf: true },
    { id: 's1', name: '陳柏翰', major: '資訊管理學系 三年級', studentId: '110XXXXX', email: 'bohan.chen@example.edu.tw',
      bio: '喜歡打籃球，這學期想把 D3 辨識多練起來！', scores: { d1: 48, d2: 55, d3: 62, d4: 50 },
      practice: '已完成 3 關，平均 54 分', competition: '參加 1 場競賽，最佳名次第 2 名',
      visible: { studentId: true, email: false, bio: true, d4: true, practice: false, competition: true } },
    { id: 's2', name: '林宜蓁', major: '企業管理學系 三年級', studentId: '110YYYYY', email: 'yizhen.lin@example.edu.tw',
      bio: '', scores: { d1: 70, d2: 65, d3: 58, d4: 72 },
      practice: '已完成 4 關，平均 68 分', competition: '參加 2 場競賽，最佳名次第 1 名',
      visible: { studentId: false, email: false, bio: true, d4: true, practice: true, competition: false } },
    { id: 's3', name: '黃于軒', major: '資訊管理學系 三年級', studentId: '110ZZZZZ', email: 'yuxuan.huang@example.edu.tw',
      bio: 'AI 提示工程超有趣，正在練幻覺查核！', scores: { d1: 55, d2: 60, d3: 45, d4: 66 },
      practice: '已完成 2 關，平均 50 分', competition: '尚未參加競賽',
      visible: { studentId: true, email: true, bio: true, d4: false, practice: false, competition: false } },
  ],
  c2: [
    { id: 'self', isSelf: true },
    { id: 's4', name: '吳珮瑜', major: '資訊管理學系 四年級', studentId: '109AAAAA', email: 'peiyu.wu@example.edu.tw',
      bio: '專題研究做跨組協作主題，歡迎交流！', scores: { d1: 62, d2: 58, d3: 70, d4: 64 },
      practice: '已完成 4 關，平均 61 分', competition: '參加 1 場競賽，最佳名次第 3 名',
      visible: { studentId: false, email: true, bio: true, d4: true, practice: true, competition: true } },
  ],
};

export const AVATAR_PALETTE = ['#C1495B', '#C98A2E', '#2F8F6C', '#3B6EA5', '#8B5FBF', '#B5652E', '#4A7C94', '#9B5DE5'];
export function avatarColorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = (hash * 31 + name.charCodeAt(i)) >>> 0; }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/* 目前名單裡出現的姓氏筆畫數，用來排序同學名單（非完整姓氏筆畫字典） */
export const SURNAME_STROKES = { 吳: 7, 林: 8, 陳: 11, 黃: 12, 劉: 15 };
export function surnameStrokeCount(name) {
  return SURNAME_STROKES[name.charAt(0)] ?? 99;
}

export function sortedRoster(courseId) {
  return (CLASSMATES[courseId] || []).slice().sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    return surnameStrokeCount(a.name) - surnameStrokeCount(b.name);
  });
}

/* ---------- 賽場（商業兩難競技場，學生視角，demo 用固定案例） ---------- */
export const MATCH_DURATION_SECONDS = 22 * 60 + 15;

/*
  2026-10-28 決定（賽場畫面重新設計，取代原本「個人草稿→AI整合差異卡→代表對話→提交」的
  四步驟流程，見 docs/system-flow.md 五、競賽中）：
  - 教師一次發起競賽可能指派不只一個案例，畫面左側有「題目列表」可以切換（ARENA_CASES）。
    題目本身也有鎖定機制，做法跟階段一樣：教師目前開放到第幾題（`unlockedCaseIndex`），還
    沒開放的題目整個鎖住、連題目標題都不給看，只秀「題目 N」加鎖頭；已經開放過、現在不是
    最新那一題的題目可以點回去查看（答過的內容都看得到），但不是目前最新那一題，一樣蓋一層
    半透明遮罩。
  - 每個案例底下分成好幾個「階段」（原本的小題，畫面上顯示「階段一／二／三…」）；**階段數量
    依題目而定，不是寫死 3 個**——下面每個案例的 `stages` 陣列長度不一樣，就是故意這樣示範。
  - 階段有鎖定機制：教師目前開放到第幾階段（`unlockedSubQ`），比這個數字大的階段鎖住、不能
    點；比這個數字小（已經開放過、現在不是最新那個）的階段不會鎖住、可以點回去看，但分頁上
    會蓋一層半透明遮罩，提示「這不是目前最新開放的階段」，跟鎖住的階段區分開來。
  - 只有「目前這一題」且「目前這個階段」都是最新開放的那一個，才能繼續跟 AI 對話、送出答案；
    不是目前最新的題目／階段只能檢視過去的內容，不能再對話或送出；競賽暫停時（`isArenaPaused`）
    不管在哪一題哪一階段都不能對話或送出，要等教師恢復。
  - 每個階段各自有一個跟 AI 的對話框，做法跟練習題（Dojo.jsx）一樣——每個人都有自己的對話，
    不是只有「代表」能打字。AI 的回覆不是一整塊文字，而是拆成好幾個列點（`points`），每個
    列點前面都有勾選框，使用者可以只挑其中幾點勾起來，按「送出勾選的答案」一次送出，不是整
    份答案一起送出。
  - 每個階段出題時，教師就先設好一組「基本答案」（像強棒出擊／Family Feud 的答案板）；**答案
    格數也依題目而定，不是寫死 6 格**——下面每個階段的 `basicAnswers` 陣列長度也刻意不一樣。
    送出的列點只要跟板上某一格夠像，就把那一格亮出來、算分；這是「只要答得出來就給分」，組間
    彼此看不到別組亮了哪幾格（私下計分，不像下面的公開搶答區）。
  - 基本答案以外的列點會進「公開搶答區」：全班都看得到，同樣／很相似的內容先搶先贏，後面重複
    送出算 0 分；搶到的分數高低看這則內容跟基本答案組的相似度（越接近基本答案，代表越貼近
    官方重視的面向，分數越高）。
  - 教師提示改成左側常駐的「教師提示區」清單，不用再按「重播提示」才看得到；新提示進來時畫面
    右下角還是會跳一次提示條（toast），但看過之後提示仍然留在清單裡，隨時可以回去看。
  這些都是前端示範：案例／階段／基本答案都是寫死的 demo 資料（之後應該要跟著題庫一起讓老師
  設定），AI 回覆的列點內容是固定示範文字，文字相似度也只是正規化後算共同字元比例的粗略估計，
  不是真的語意判斷，正式版都要換成由 AI／題庫資料決定。
*/

export const ARENA_CASES = [
  {
    id: 'supply-chain',
    tag: '供應鏈勞動爭議',
    brief: [
      '「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。財務長認為更換供應商將墊高短期成本並影響出貨穩定；永續長主張若不處理將重創品牌信任度；人資長則擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層。',
      '每個階段都有自己跟 AI 的對話框，AI 回覆的每個列點旁邊都有勾選框，勾選後按「送出勾選的答案」就會一次送出：答到教師預先設好的「基本答案」就會亮起一格、私下計分；答到別的內容則會送進公開搶答區，全班都看得到，先搶先贏。',
    ],
    stages: [
      {
        title: '釐清利害關係人與問題全貌',
        basicAnswers: [
          '辨識出倉儲部門是主要利害關係人', '辨識出供應商窗口是主要利害關係人', '辨識出現有客戶信任是核心問題',
          '辨識出員工士氣是潛在風險', '釐清是否已違反勞動法規', '釐清媒體延燒的時間壓力',
        ],
      },
      {
        title: '提出應對方案與替代選項',
        basicAnswers: [
          '提出立即更換供應商方案', '提出要求現供應商限期改善方案', '提出雙供應商並行過渡方案', '提出暫停下單、啟動稽核方案',
        ],
      },
      {
        title: '量化財務／營運影響',
        basicAnswers: [
          '量化更換供應商的物流成本增幅', '量化品牌信任受損的營收風險', '量化雙供應商並行的倉儲成本',
          '量化緩衝期測試出貨的額外費用', '量化稽核導入的時間與人力成本',
        ],
      },
    ],
  },
  {
    id: 'delivery-rights',
    tag: '外送勞權兩難',
    brief: [
      '外送平台「快送到」近期因一起外送員交通事故引發討論：外送員主張平台應提供職災保障，平台方則主張外送員屬承攬關係、不適用勞基法。工會要求平台正面回應，部分消費者發起拒用平台的連署，媒體開始追蹤後續發展。',
    ],
    stages: [
      {
        title: '釐清爭議的法律與利害關係人定位',
        basicAnswers: [
          '辨識出外送員是核心利害關係人', '辨識出消費者信任是潛在風險', '釐清承攬與僱傭關係的法律界線',
        ],
      },
      {
        title: '提出因應方案',
        basicAnswers: ['提出比照職災提供保障方案', '提出與工會協商方案', '提出對外說明聲明方案'],
      },
    ],
  },
];

export function findArenaCase(caseId) {
  return ARENA_CASES.find((c) => c.id === caseId);
}

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export function stageLabel(n) {
  return CN_NUM[n] || String(n);
}

export const BASIC_ANSWER_MATCH_THRESHOLD = 0.5;
export const PUBLIC_DUPLICATE_THRESHOLD = 0.65;

function normalizeForMatch(text) {
  return text.replace(/[\s，。、！？「」『』（）()[\]{}：:；;,.!?~]/g, '').toLowerCase();
}

// demo 用的粗略文字相似度：正規化後算共同字元的比例，不是真的語意相似度（正式版要換成 AI 判斷）
function textSimilarity(a, b) {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const setA = new Set(na);
  const setB = new Set(nb);
  let overlap = 0;
  setA.forEach((ch) => { if (setB.has(ch)) overlap++; });
  return overlap / Math.max(setA.size, setB.size);
}

// 挑出跟這則內容最像的「還沒亮起來」的基本答案格；revealed 是這一隊已經亮過的格子索引
export function matchBasicAnswer(caseId, subq, text, revealed) {
  const list = findArenaCase(caseId).stages[subq - 1].basicAnswers;
  let best = null;
  list.forEach((answer, index) => {
    if (revealed.includes(index)) return;
    const sim = textSimilarity(text, answer);
    if (sim >= BASIC_ANSWER_MATCH_THRESHOLD && (!best || sim > best.sim)) best = { index, sim, answer };
  });
  return best;
}

export function isDuplicateInPublicBuzz(publicBuzzList, text) {
  return publicBuzzList.some((entry) => textSimilarity(text, entry.text) >= PUBLIC_DUPLICATE_THRESHOLD);
}

// 跟基本答案組的相似度決定搶答分數高低：越接近基本答案分數越高
export function publicBuzzScore(caseId, subq, text) {
  const list = findArenaCase(caseId).stages[subq - 1].basicAnswers;
  let maxSim = 0;
  list.forEach((answer) => { maxSim = Math.max(maxSim, textSimilarity(text, answer)); });
  if (maxSim >= 0.45) return 3;
  if (maxSim >= 0.25) return 2;
  return 1;
}

function updateStage(state, caseId, subq, updater) {
  const caseState = state.cases[caseId];
  const stage = caseState.stages[subq];
  return {
    ...state,
    cases: { ...state.cases, [caseId]: { ...caseState, stages: { ...caseState.stages, [subq]: updater(stage) } } },
  };
}

// 送出一則內容當作這個階段的答案：先比對基本答案，比對不到才進公開搶答區（搶答區要先檢查
// 有沒有人（含自己）已經搶過很相似的內容，有的話這次不計分）。
export function submitArenaAnswer(state, caseId, subq, text) {
  const caseState = state.cases[caseId];
  const stage = caseState.stages[subq];
  const basicMatch = matchBasicAnswer(caseId, subq, text, stage.revealed);
  if (basicMatch) {
    const nextState = updateStage(state, caseId, subq, (s) => ({ ...s, revealed: [...s.revealed, basicMatch.index] }));
    return { state: { ...nextState, myScore: nextState.myScore + 2 }, result: { type: 'basic', answer: basicMatch.answer } };
  }
  const buzzList = caseState.publicBuzz[subq];
  if (isDuplicateInPublicBuzz(buzzList, text)) {
    return { state, result: { type: 'duplicate' } };
  }
  const score = publicBuzzScore(caseId, subq, text);
  const entry = { team: '你', text, score, at: Date.now() };
  const nextCaseState = { ...caseState, publicBuzz: { ...caseState.publicBuzz, [subq]: [...buzzList, entry] } };
  const nextState = { ...state, cases: { ...state.cases, [caseId]: nextCaseState }, myScore: state.myScore + score };
  return { state: nextState, result: { type: 'public', score } };
}

// 一次送出好幾個勾選的列點，回傳套用完所有列點之後的 state，以及一份彙總結果給 toast 用
export function submitArenaAnswers(state, caseId, subq, texts) {
  let s = state;
  const summary = { basicCount: 0, basicScore: 0, publicCount: 0, publicScore: 0, dupCount: 0 };
  texts.forEach((text) => {
    const r = submitArenaAnswer(s, caseId, subq, text);
    s = r.state;
    if (r.result.type === 'basic') { summary.basicCount += 1; summary.basicScore += 2; }
    else if (r.result.type === 'public') { summary.publicCount += 1; summary.publicScore += r.result.score; }
    else summary.dupCount += 1;
  });
  return { state: s, summary };
}

function freshStageState() {
  return { messages: [], revealed: [] };
}

export function pushArenaUserMessage(state, caseId, subq, text) {
  return updateStage(state, caseId, subq, (stage) => ({
    ...stage,
    messages: [...stage.messages, { role: 'user', text }, { role: 'ai', text: '思考中…', pending: true }],
  }));
}

// AI 回覆拆成好幾個列點（示範固定文字），不是一整塊文字——畫面上每個列點各自有勾選框可以挑著送出
function generateArenaPoints(isFirst) {
  return isFirst
    ? [
        '（示範）先列出目前看到的第一個重點。',
        '（示範）再列出第二個重點，這是前端示範用的固定文字。',
        '（示範）第三個重點，正式串接 AI 後會依你的實際輸入即時生成不同的列點內容。',
      ]
    : [
        '（示範）根據你的補充，調整後的重點 A（示範固定文字）。',
        '（示範）調整後的重點 B，同樣是示範用的固定文字。',
      ];
}

export function resolveArenaAIReply(state, caseId, subq, pendingIndex, isFirst) {
  return updateStage(state, caseId, subq, (stage) => {
    const messages = stage.messages.slice();
    messages[pendingIndex] = { role: 'ai', points: generateArenaPoints(isFirst), pending: false };
    return { ...stage, messages };
  });
}

export function setCurrentSubQ(state, caseId, n) {
  return { ...state, cases: { ...state.cases, [caseId]: { ...state.cases[caseId], currentSubQ: n } } };
}

export function unlockNextStage(state, caseId) {
  const caseState = state.cases[caseId];
  const total = findArenaCase(caseId).stages.length;
  if (caseState.unlockedSubQ >= total) return state;
  const next = caseState.unlockedSubQ + 1;
  return { ...state, cases: { ...state.cases, [caseId]: { ...caseState, unlockedSubQ: next, currentSubQ: next } } };
}

export function setCurrentCase(state, caseId) {
  return { ...state, currentCaseId: caseId };
}

// 教師開放下一題：跟 unlockNextStage 同一套邏輯，只是作用在「題目」這一層
export function unlockNextCase(state) {
  if (state.unlockedCaseIndex >= ARENA_CASES.length - 1) return state;
  const nextIndex = state.unlockedCaseIndex + 1;
  return { ...state, unlockedCaseIndex: nextIndex, currentCaseId: ARENA_CASES[nextIndex].id };
}

export const DEMO_HINT_TEXT = '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？';

export function pushHint(state, text) {
  return { ...state, hints: [...state.hints, { text, at: Date.now() }] };
}

export function freshArenaState() {
  const cases = {};
  ARENA_CASES.forEach((c) => {
    const state = { currentSubQ: 1, unlockedSubQ: 1, stages: {}, publicBuzz: {} };
    c.stages.forEach((_, i) => {
      state.stages[i + 1] = freshStageState();
      state.publicBuzz[i + 1] = [];
    });
    cases[c.id] = state;
  });
  // demo：供應鏈勞動爭議這題，公開搶答區先放一筆別隊的紀錄，展示「全班都看得到」
  cases['supply-chain'].publicBuzz[1] = [
    { team: 'B 隊', text: '辨識出供應商窗口是主要利害關係人', score: 3, at: Date.now() - 240000 },
  ];
  return {
    matchSecondsLeft: MATCH_DURATION_SECONDS,
    isArenaPaused: false,
    currentCaseId: ARENA_CASES[0].id,
    unlockedCaseIndex: 0, // demo：老師目前只開放第一題，其他題目鎖住（連題目都不給看，只秀題號）
    cases,
    hints: [{ text: DEMO_HINT_TEXT, at: Date.now() - 300000 }],
    myScore: 0,
  };
}

export function formatMatchTime(totalSeconds) {
  const s = Math.max(totalSeconds, 0);
  const m = Math.floor(s / 60), sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

