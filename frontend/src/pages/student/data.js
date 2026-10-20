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

export const DEFAULT_VISIBILITY = {
  studentId: true, email: false, bio: true, d4: true, practice: false, competition: true,
};

export const PRACTICE_STATUS_LABEL = { 'in-progress': '進行中', completed: '已完成' };

