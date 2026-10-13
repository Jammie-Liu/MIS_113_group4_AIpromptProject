/* ---------- practice problems (練習題，依難度分組，可自由選題) ---------- */
const DIM_NAMES = {d1:'委託', d2:'描述', d3:'辨識', d4:'盡責'};
const TIERS = [
  {id:'simple', label:'簡單', diffClass:'bronze'},
  {id:'medium', label:'中等', diffClass:'silver'},
  {id:'hard', label:'困難', diffClass:'gold'},
];
const TIER_UNLOCK_N = 2; // 示範用：完成前一難度幾題後解鎖下一難度

const PROBLEMS = {
  'p-intro': {
    tier:'simple', title:'初探提問',
    scenario:'你剛開始接觸 AI 寫作小幫手。主管請你先練習最基本的提問技巧：請 AI 幫忙寫一段活動公告。',
    outcomeType:'一段活動公告文字',
    observation:'這一題會觀察：你有沒有在提示裡講清楚活動的基本資訊（時間、地點、對象），而不是只給一句模糊的指令。',
    indicators:[
      {id:'i1', label:'活動資訊完整', dim:'d2', base0:1},
      {id:'i2', label:'指定格式／長度', dim:'d2', base0:0},
      {id:'i3', label:'留意讀者語氣', dim:'d2', base0:'unseen'},
    ],
    hints:[
      '先想想：這則公告的讀者是誰？時間、地點、對象你都講清楚了嗎？',
      '試試套用這個模板：「請幫我寫一則＿＿活動的公告，時間是＿＿、地點在＿＿，對象是＿＿，語氣要＿＿，用＿＿格式呈現。」',
      '完整範例：「請幫我寫一則系學會迎新茶會的活動公告，時間是 10/20（五）18:00，地點在系館中庭，對象是全系大一新生，<mark>語氣活潑親切一點</mark>，請用<mark>三到四行、附一個吸引人的標題</mark>。」',
    ],
  },
  'p-halluc': {
    tier:'medium', title:'幻覺查核',
    scenario:'AI 在回答你問題時引用了一個統計數字，但你不確定這個數字是真的還是 AI 自己編的。',
    outcomeType:'一段附查證要求的提示',
    observation:'這一題會觀察：你有沒有主動要求 AI 標示資料來源，或提醒自己要交叉核對數字的真實性。',
    indicators:[
      {id:'i1', label:'要求標示來源', dim:'d3', base0:0},
      {id:'i2', label:'質疑推論邏輯', dim:'d3', base0:1},
    ],
    hints:[
      '先想想：AI 給的數字，你要怎麼確認它不是編出來的？',
      '試試套用這個模板：「你剛剛提到的＿＿數字，請告訴我這是根據什麼資料來源？如果不確定，請直接說不確定，不要硬湊一個答案。」',
      '完整範例：「你剛剛提到『產業平均違規率 42%』，<mark>請告訴我這個數字的原始來源是什麼</mark>，<mark>如果你無法確定來源，請明講這是推測而不是事實</mark>，我會再自己查證。」',
    ],
  },
  bank1: {
    tier:'simple', title:'會議效率提案',
    scenario:'你的部門想縮短每週例會時間，但不想犧牲重要討論品質。請 AI 幫忙發想至少兩個具體做法。',
    outcomeType:'至少兩個具體做法的提案',
    observation:'這一題會觀察：你的提示有沒有給 AI 足夠脈絡（目前會議多長、參加人數、常見討論主題），而不是只丟一句籠統的「幫我想辦法」。',
    indicators:[
      {id:'i1', label:'脈絡完整', dim:'d2', base0:0},
      {id:'i2', label:'格式／限制', dim:'d2', base0:0},
      {id:'i3', label:'目標明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：你的部門目前開會多久、幾個人參加、常聊什麼？這些脈絡 AI 都不知道。',
      '試試套用這個模板：「我們部門目前每週例會＿＿分鐘、＿＿人參加，常花時間在＿＿。請提出至少兩個具體做法，能把會議縮短到＿＿分鐘以內，並列出優缺點。」',
      '完整範例：「我們部門目前每週例會 90 分鐘、10 人參加，常常花很多時間在單向報告。請 AI 提出至少兩個具體做法，能把會議縮短到 60 分鐘以內，同時保留重要討論的時間，<mark>並用條列式列出優缺點</mark>。」',
    ],
  },
  bank2: {
    tier:'simple', title:'新人培訓方案',
    scenario:'公司想設計一套新人一週內能上手的訓練流程，請 AI 提出規劃架構。',
    outcomeType:'一週訓練計畫',
    observation:'這一題會觀察：有沒有指定新人背景／職位，避免 AI 給出過於籠統的訓練表。',
    indicators:[
      {id:'i1', label:'脈絡完整', dim:'d2', base0:0},
      {id:'i2', label:'格式／限制', dim:'d2', base0:0},
      {id:'i3', label:'目標明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：這位新人是什麼職位、什麼部門？沒講清楚，AI 只能給很籠統的建議。',
      '試試套用這個模板：「我們要幫新加入的＿＿設計一週訓練計畫，請用＿＿的格式列出，每天包含＿＿。」',
      '完整範例：「我們要幫新加入的<mark>客服專員</mark>設計一週訓練計畫，<mark>請用每日行程表的格式列出</mark>，每天包含 1 個學習重點與 1 個實作練習。」',
    ],
  },
  bank3: {
    tier:'medium', title:'內部獎勵制度',
    scenario:'HR 想推出低成本但有感的員工獎勵方案，請 AI 發想三個可行方向。',
    outcomeType:'三個獎勵方案發想',
    observation:'這一題會觀察：你有沒有意識到「最終要不要採用」該由 HR 團隊決定，AI 只負責發想不做決策。',
    indicators:[
      {id:'i1', label:'保留把關', dim:'d1', base0:0},
      {id:'i2', label:'能力判斷', dim:'d1', base0:0},
      {id:'i3', label:'目標明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：「哪個方案最好、就用哪個」這種決定，應該讓 AI 幫你拍板嗎？',
      '試試套用這個模板：「請發想三個＿＿方案，每個請標出＿＿，我會跟＿＿討論後再決定要採用哪一個。」',
      '完整範例：「幫我發想三個低成本但員工有感的獎勵方案，<mark>每個方案請標出可能需要的預算範圍與潛在風險</mark>，我會和 HR 團隊一起討論後<mark>再決定要採用哪一個</mark>。」',
    ],
  },
  bank5: {
    tier:'medium', title:'跨部門溝通落差',
    scenario:'業務與工程部門常常資訊不同步，請 AI 提出一個低成本的溝通機制建議。',
    outcomeType:'一個溝通機制建議',
    observation:'這一題會觀察：有沒有讓 AI 了解問題實際發生在哪個環節，而不是憑空建議。',
    indicators:[
      {id:'i1', label:'脈絡完整', dim:'d2', base0:0},
      {id:'i2', label:'格式／限制', dim:'d2', base0:0},
      {id:'i3', label:'目標明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：資訊不同步具體是發生在哪個環節？需求變更沒同步？進度看板沒更新？',
      '試試套用這個模板：「業務常常在＿＿後沒有即時同步給工程端，導致＿＿。請提出一個低成本的溝通機制建議，並列出至少兩個做法。」',
      '完整範例：「業務常常在需求變更後沒有即時同步給工程端，導致進度誤判。請 AI 提出一個低成本、不需要額外開會的溝通機制建議，<mark>用條列式列出至少兩個做法並說明適用情境</mark>。」',
    ],
  },
  complaint: {
    tier:'hard', title:'客訴回覆信改寫',
    scenario:'你是行銷部窗口。一位顧客因物流延誤寫信抱怨，語氣強硬並要求全額退款。主管請你先請 AI 幫忙，把回覆信改得更專業、更能安撫顧客，同時你需要決定「退款與否」最終由誰拍板。',
    outcomeType:'一封給顧客的回覆信',
    observation:'這一題會觀察：你有沒有意識到「退款決策」不該完全交給 AI 自己決定。',
    indicators:[
      {id:'i1', label:'範圍界定', dim:'d2', base0:2},
      {id:'i2', label:'能力判斷', dim:'d1', base0:0},
      {id:'i3', label:'保留把關', dim:'d1', base0:0},
    ],
    hints:[
      '先想想：退款與否，是 AI 該直接幫你決定的事嗎？',
      '試試套用這個模板：「幫我把這封客訴信改得更專業、更能安撫顧客，<mark>但先不要承諾退款</mark>——請條列出幾個可能的處理方向，並標明哪些需要你自己再確認。」',
      '完整範例：「幫我把這封客訴信改得更專業、口氣更能安撫顧客，<mark>但先不要承諾退款</mark>——<mark>請條列出 2 個可能的處理方向</mark>（例如補償優惠券／加速換貨），<mark>並標明哪些是妳需要跟主管確認的部分</mark>，讓我最後自己決定要用哪一個。」',
    ],
  },
  ethics: {
    tier:'hard', title:'方案裡的隱藏代價',
    scenario:'AI 依你先前的提示，建議「裁減 10% 人力以降低成本」作為主要方案。這一題要練習如何用提示引導 AI，在維持方案可行性的同時，一併提出並評估這個方案對員工、品牌信任的倫理風險，並思考揭露策略。',
    outcomeType:'一份裁員方案的風險評估',
    observation:'這一題會觀察：你的提示有沒有主動要求 AI 揭露潛在倫理風險，而不是照單全收「裁員＝省成本」這個單一結論。',
    indicators:[
      {id:'i1', label:'倫理風險意識', dim:'d4', base0:0},
      {id:'i2', label:'揭露誠實', dim:'d4', base0:0},
      {id:'i3', label:'格式明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：裁員對員工士氣、外部品牌信任會有什麼風險？這些 AI 主動提到了嗎？',
      '試試套用這個模板：「在維持成本目標的前提下，請先列出裁員方案對＿＿可能造成的風險，並提出至少一個能降低風險的溝通作法，最後才補充名單排序邏輯。」',
      '完整範例：「在維持成本目標的前提下，請AI先列出裁員方案<mark>對員工士氣、外部品牌信任可能造成的三個風險</mark>，並<mark>提出至少一個能降低這些風險的溝通／緩衝作法</mark>，最後才補充名單排序邏輯。」',
    ],
  },
  bank4: {
    tier:'hard', title:'客服 SOP 優化',
    scenario:'客服團隊常常被同樣的問題卡住，請 AI 幫忙設計一份可以縮短處理時間的應對指南草案。',
    outcomeType:'一份客服應對指南草案',
    observation:'這一題會觀察：你有沒有要求 AI 標示哪些應對方式是「AI 自己推測」、哪些是有實際準則支持。',
    indicators:[
      {id:'i1', label:'格式／限制', dim:'d2', base0:2},
      {id:'i2', label:'要求佐證', dim:'d3', base0:0},
      {id:'i3', label:'事後查核', dim:'d3', base0:0},
    ],
    hints:[
      '先想想：AI 列出的應對方式，哪些是有準則支持、哪些只是它自己推測的？',
      '試試套用這個模板：「幫我草擬一份客服應對指南，針對常見問題列出建議回答，並請標明哪些是根據＿＿、哪些只是你的推測。」',
      '完整範例：「幫我草擬一份客服應對指南，針對常見問題列出建議回答，<mark>並請你標明哪些是根據一般客服準則、哪些只是你的推測</mark>——推測的部分我需要再跟資深客服確認過才會採用。」',
    ],
  },
  bank6: {
    tier:'hard', title:'老字號手搖飲品牌轉型兩難',
    scenario:'「甜心堂」是經營 20 年的手搖飲連鎖品牌，全台有 120 家分店。近年手搖飲市場競爭激烈，年輕消費者轉向手作精品咖啡與低糖健康飲品，甜心堂的營收連續三年下滑。行銷部提出「全面轉型健康低糖路線」，但研發與供應鏈需要至少 8 個月才能完成配方與供應商調整；財務部則擔心轉型期間流失既有重糖客群，導致現金流吃緊。你是策略顧問，需要用 AI 協助評估這個轉型決策。任務：請 AI 幫你評估「全面轉型」與「漸進式雙軌並行」兩個路線的優劣，並指出至少一個你認為 AI 分析中可能忽略的風險。',
    outcomeType:'一份轉型路線評估',
    observation:'這一題會觀察：你的提示有沒有要求 AI 同時考慮短期現金流與長期品牌定位兩個時間尺度，而不是只回答其中一個。',
    indicators:[
      {id:'i1', label:'脈絡完整', dim:'d2', base0:0},
      {id:'i2', label:'格式／限制', dim:'d2', base0:0},
      {id:'i3', label:'要求查核', dim:'d3', base0:0},
    ],
    hints:[
      '先想想：題目給的關鍵限制（8 個月轉型期、既有客群流失風險）你有帶進提示裡嗎？',
      '試試套用這個模板：「甜心堂考慮轉型健康低糖路線，但研發需要＿＿、轉型期間可能流失＿＿。請比較兩個路線的優劣，並指出你的分析中有哪些是基於假設、可能被我忽略的風險。」',
      '完整範例：「甜心堂手搖飲品牌考慮轉型健康低糖路線，但研發需要 8 個月、轉型期間可能流失既有重糖客群。請比較『全面轉型』與『漸進式雙軌並行』兩個路線的優劣，<mark>並明確指出你的分析中有哪些是基於假設、可能被我忽略的風險</mark>，最後我會再跟財務與行銷團隊一起討論定案。」',
    ],
  },
  bank7: {
    tier:'hard', title:'新創公司募資兩難',
    scenario:'一家 B2B SaaS 新創目前月營收成長穩定，但現金僅夠再撐 4 個月。天使輪投資人願意加碼，但要求提高持股比例並取得董事會否決權；同時有一家策略型企業客戶提出併購意向，估值略低於天使輪但可立即解決現金危機並綁定大客戶。你是創辦人的顧問，要協助評估。任務：請 AI 分析「接受加碼但讓出否決權」與「被併購」兩個選項對公司長期自主性與團隊的影響，並要求 AI 標示它無法確定的變數。',
    outcomeType:'一份兩個選項的比較分析',
    observation:'這一題會觀察：你有沒有意識到「最終決定該由創辦人與董事會決定」，AI 只能輔助分析不能替你做決定；以及有沒有要求 AI 標示它無法確定的變數。',
    indicators:[
      {id:'i1', label:'保留把關', dim:'d1', base0:0},
      {id:'i2', label:'要求標示不確定性', dim:'d3', base0:0},
      {id:'i3', label:'目標明確', dim:'d2', base0:2},
    ],
    hints:[
      '先想想：「該選哪個」這個最終決定，是該讓 AI 替你拍板的事嗎？',
      '試試套用這個模板：「請分析＿＿與＿＿這兩個選項，對公司長期自主性與團隊的影響，並標示出哪些是你無法確定、需要我再確認的變數。」',
      '完整範例：「請分析『接受天使輪加碼但讓出董事會否決權』與『被策略型企業併購』這兩個選項，對公司長期自主性與團隊的影響，<mark>並標示出哪些是你無法確定、需要我再跟董事會確認的變數</mark>——最終決定我會跟共同創辦人一起討論後再拍板。」',
    ],
  },
};

/* ---------- 指標主檔：每個行為的固定說明（定義＋好例子＋壞例子），給「什麼是這個？」用 ---------- */
/* 同一個行為標籤在不同題目重複出現時共用同一筆說明，不用每題各寫一份 */
const INDICATOR_INFO = {
  '活動資訊完整': {def:'有沒有把活動的時間、地點、對象等基本資訊講清楚。', good:'「時間是 10/20（五）18:00，地點在系館中庭，對象是大一新生。」', bad:'「幫我寫一則活動公告。」（完全沒有細節）'},
  '指定格式／長度': {def:'有沒有指定成果要用什麼格式或多長。', good:'「請用三到四行，附一個吸引人的標題。」', bad:'完全沒提格式或長度，讓 AI 自由發揮。'},
  '留意讀者語氣': {def:'有沒有考慮到讀者是誰、該用什麼語氣寫。', good:'「對象是大一新生，語氣要活潑親切一點。」', bad:'沒有提到讀者是誰或該用什麼語氣。'},
  '要求標示來源': {def:'有沒有要求 AI 說明數字或資料的來源。', good:'「這個數字的原始來源是什麼？」', bad:'直接採信 AI 給的數字，不追問來源。'},
  '質疑推論邏輯': {def:'有沒有對 AI 的推論或結論提出合理的懷疑。', good:'「如果你不確定，請直接說不確定，不要硬湊答案。」', bad:'照單全收 AI 的說法，不多問一句。'},
  '脈絡完整': {def:'有沒有給 AI 足夠的背景資訊（現況、限制、規模等）。', good:'「目前每週例會 90 分鐘、10 人參加。」', bad:'「幫我想辦法讓開會變快一點。」（沒有任何背景）'},
  '格式／限制': {def:'有沒有要求輸出成特定格式，或限制數量、範圍。', good:'「請用條列式列出優缺點。」', bad:'沒有限制格式，AI 想怎麼回答都行。'},
  '目標明確': {def:'有沒有把想達成的目標講清楚。', good:'「縮短到 60 分鐘以內，同時保留重要討論時間。」', bad:'「讓會議變快一點。」（目標模糊）'},
  '保留把關': {def:'有沒有把最終決定權留給自己，而不是讓 AI 直接拍板。', good:'「列出方案和風險，我會再跟團隊討論後決定。」', bad:'「告訴我哪個最好，我們就用哪個。」'},
  '能力判斷': {def:'有沒有意識到這個決定不該完全交給 AI。', good:'「退款與否我需要再跟主管確認。」', bad:'讓 AI 直接決定要不要退款、退多少。'},
  '要求佐證': {def:'有沒有要求 AI 說明建議的依據來源。', good:'「請標明哪些有準則支持、哪些只是推測。」', bad:'直接採用 AI 的建議，不問依據是什麼。'},
  '事後查核': {def:'有沒有對 AI 生成的內容進一步提出質疑或要求驗證。', good:'「推測的部分我會再跟資深同事確認過才採用。」', bad:'收到回答後直接拿去用，不再查核。'},
  '要求查核': {def:'有沒有要求 AI 指出分析中可能忽略的風險或假設。', good:'「請指出你分析中有哪些是基於假設、可能被忽略的風險。」', bad:'只看結論，不問背後的假設是什麼。'},
  '範圍界定': {def:'有沒有清楚說明這次要 AI 做什麼、不做什麼。', good:'「先改語氣就好，不要承諾退款。」', bad:'沒有界定範圍，讓 AI 自己決定做到哪裡。'},
  '倫理風險意識': {def:'有沒有主動要求 AI 評估方案的倫理或風險影響。', good:'「請列出對員工士氣、品牌信任可能造成的風險。」', bad:'只看成本，沒想到對員工或社會的影響。'},
  '揭露誠實': {def:'有沒有考慮後續要怎麼向利害關係人溝通或揭露這個決策。', good:'「請提出一個能降低風險的溝通或緩衝作法。」', bad:'沒有想過要怎麼對外說明這個決策。'},
  '格式明確': {def:'有沒有具體要求輸出的格式或結構。', good:'「請列出名單排序的邏輯。」', bad:'沒有要求任何具體格式。'},
  '要求標示不確定性': {def:'有沒有要求 AI 標示它無法確定的部分。', good:'「請標示出哪些是你無法確定、需要我再確認的變數。」', bad:'把 AI 的推測當成確定的事實直接採用。'},
};
function indicatorInfoFor(label){
  return INDICATOR_INFO[label] || {def:'這個行為還沒有登錄說明。', good:'—', bad:'—'};
}

/* ---------- practice state machine（回合、對話、提示、結果，皆為前端模擬） ---------- */
const PRACTICE_STATE = {};
function freshPracticeState(){
  return {
    status:'not-started', round:1, roundEnded:false, endedBy:null,
    messages:[], userMsgCountThisRound:0, hintRevealed:false, hintLevelOpen:0,
    observationShown:false, aiSuggestDismissedThisRound:false, roundsHistory:[],
  };
}
function getPracticeState(id){
  if(!PRACTICE_STATE[id]) PRACTICE_STATE[id] = freshPracticeState();
  return PRACTICE_STATE[id];
}
let _demoFailureShown = false;

function completedCountInTier(tierId){
  return Object.keys(PROBLEMS).filter(id=>PROBLEMS[id].tier===tierId && getPracticeState(id).status==='completed').length;
}
function isTierUnlocked(tierId){
  if(tierId==='simple') return true;
  if(tierId==='medium') return completedCountInTier('simple') >= TIER_UNLOCK_N;
  if(tierId==='hard') return completedCountInTier('medium') >= TIER_UNLOCK_N;
  return true;
}

function indicatorScoreForRound(ind, round){
  if(ind.base0 === 'unseen'){
    if(round<=1) return 'unseen';
    if(round===2) return 1;
    return 2;
  }
  return round===1 ? ind.base0 : 2;
}
function computeRoundResult(problem, round, evidenceMsgIndex){
  const indicatorResults = problem.indicators.map(ind=>({
    id:ind.id, label:ind.label, dim:ind.dim,
    score:indicatorScoreForRound(ind, round), evidenceMsgIndex,
  }));
  const scored = indicatorResults.filter(r=>r.score!=='unseen');
  const completed = scored.length>0 && scored.every(r=>r.score===2);
  const unmet = scored.filter(r=>r.score<2).map(r=>r.label);
  return {round, indicatorResults, completed, unmet};
}
function dimFeedbackText(dimKey, scores){
  const vals = scores.filter(s=>typeof s==='number');
  if(vals.length===0) return '這一題這回合還沒有機會展現「'+DIM_NAMES[dimKey]+'」向度的行為。';
  const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
  if(avg>=2) return '「'+DIM_NAMES[dimKey]+'」這個向度這回合掌握得不錯，繼續保持。';
  if(avg>=1) return '「'+DIM_NAMES[dimKey]+'」這個向度這回合有抓到一部分重點，但還可以更具體一點，可以參考提示區的做法。';
  return '「'+DIM_NAMES[dimKey]+'」這個向度這回合還沒有明顯展現，建議打開提示區看看可以怎麼調整提示。';
}

/* ---------- my courses ---------- */
const COURSES = [
  {id:'c1', name:'AI 提示工程與批判思考', teacherIds:['t1','t2'], schedule:'週三 3-4 節', activeArenas:[
    {id:'a1', title:'供應鏈勞動爭議', status:'進行中 · 第 3 小題（共 3 題）'},
  ]},
  {id:'c2', name:'資訊管理專題研究', teacherIds:['t3'], schedule:'週五 6-7 節', activeArenas:[]},
];

/* ---------- teachers ---------- */
const TEACHERS = {
  t1: {id:'t1', name:'王老師', title:'副教授', dept:'資訊管理學系', email:'wang@example.edu.tw'},
  t2: {id:'t2', name:'李老師', title:'教授', dept:'資訊管理學系', email:'li@example.edu.tw'},
  t3: {id:'t3', name:'陳老師', title:'助理教授', dept:'企業管理學系', email:'chenprof@example.edu.tw'},
};

/* 這個使用者「沒有」修課的課程：只用來示範教師詳情「開過的課程」點進去但沒有權限瀏覽/加入的情況 */
const COURSES_NOT_MINE = [
  {id:'c3', name:'資料庫系統設計', teacherIds:['t1'], schedule:'週二 7-8 節', activeArenas:[
    {id:'a2', title:'資料庫正規化兩難', status:'進行中 · 第 1 小題（共 2 題）'},
  ]},
  {id:'c4', name:'批判思考與寫作', teacherIds:['t2'], schedule:'已於 2026 年上學期結束', activeArenas:[]},
];
function allCoursesList(){ return COURSES.concat(COURSES_NOT_MINE); }
function findCourseById(id){ return allCoursesList().find(c=>c.id===id); }
function isMyCourse(id){ return COURSES.some(c=>c.id===id); }

/* ---------- classmates / roster ---------- */
const CLASSMATES = {
  c1: [
    {id:'self', isSelf:true},
    {id:'s1', name:'陳柏翰', major:'資訊管理學系 三年級', studentId:'110XXXXX', email:'bohan.chen@example.edu.tw',
      bio:'喜歡打籃球，這學期想把 D3 辨識多練起來！', scores:{d1:48,d2:55,d3:62,d4:50},
      practice:'已完成 3 關，平均 54 分', competition:'參加 1 場競賽，最佳名次第 2 名',
      visible:{studentId:true, email:false, bio:true, d4:true, practice:false, competition:true}},
    {id:'s2', name:'林宜蓁', major:'企業管理學系 三年級', studentId:'110YYYYY', email:'yizhen.lin@example.edu.tw',
      bio:'', scores:{d1:70,d2:65,d3:58,d4:72},
      practice:'已完成 4 關，平均 68 分', competition:'參加 2 場競賽，最佳名次第 1 名',
      visible:{studentId:false, email:false, bio:true, d4:true, practice:true, competition:false}},
    {id:'s3', name:'黃于軒', major:'資訊管理學系 三年級', studentId:'110ZZZZZ', email:'yuxuan.huang@example.edu.tw',
      bio:'AI 提示工程超有趣，正在練幻覺查核！', scores:{d1:55,d2:60,d3:45,d4:66},
      practice:'已完成 2 關，平均 50 分', competition:'尚未參加競賽',
      visible:{studentId:true, email:true, bio:true, d4:false, practice:false, competition:false}},
  ],
  c2: [
    {id:'self', isSelf:true},
    {id:'s4', name:'吳珮瑜', major:'資訊管理學系 四年級', studentId:'109AAAAA', email:'peiyu.wu@example.edu.tw',
      bio:'專題研究做跨組協作主題，歡迎交流！', scores:{d1:62,d2:58,d3:70,d4:64},
      practice:'已完成 4 關，平均 61 分', competition:'參加 1 場競賽，最佳名次第 3 名',
      visible:{studentId:false, email:true, bio:true, d4:true, practice:true, competition:true}},
  ],
};
let MY_NAME = '劉亭慧';
const MY_STUDENT_ID = '109XXXXX';
let MY_EMAIL = 'tinghui.liu@example.edu.tw';
const MY_SCORES = {d1:52, d2:71, d3:38, d4:60};
const MY_PRACTICE_SUMMARY = '已完成 4 關，平均 51 分';
const MY_COMPETITION_SUMMARY = '參加 2 場競賽，最佳名次第 1 名';
let savedMyBio = '';

const AVATAR_PALETTE = ['#C1495B','#C98A2E','#2F8F6C','#3B6EA5','#8B5FBF','#B5652E','#4A7C94','#9B5DE5'];
function avatarColorFor(name){
  let hash = 0;
  for(let i=0;i<name.length;i++){ hash = (hash*31 + name.charCodeAt(i)) >>> 0; }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/* 目前名單裡出現的姓氏筆畫數，用來排序同學名單（非完整姓氏筆畫字典） */
const SURNAME_STROKES = {'吳':7, '林':8, '陳':11, '黃':12, '劉':15};
function surnameStrokeCount(name){
  return SURNAME_STROKES[name.charAt(0)] ?? 99;
}

/* ---------- content moderation (profanity check on any free-text field) ---------- */
const BANNED_WORDS = ['幹你','他媽的','三小','白癡','智障','去死','賤人','混蛋','婊子'];
function containsBannedWord(text){
  return BANNED_WORDS.some(w => text.includes(w));
}
const courseGrid = document.getElementById('courseGrid');
function renderCourses(){
  courseGrid.innerHTML = '';
  COURSES.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'course-card';
    const badge = c.activeArenas.length
      ? '<div class="course-badge live">🔴 '+c.activeArenas.length+' 場競賽進行中</div>'
      : '<div class="course-badge idle">目前沒有進行中的競賽</div>';
    const teacherNames = c.teacherIds.map(id=>TEACHERS[id].name).join('、');
    card.innerHTML = '<div class="t">'+c.name+'</div><div class="d">'+teacherNames+' · '+c.schedule+'</div>'+badge;
    card.addEventListener('click', ()=> loadCourseAndGoto(c.id));
    courseGrid.appendChild(card);
  });
}
renderCourses();

function loadCourseAndGoto(id){
  const c = findCourseById(id);
  const enrolled = isMyCourse(id);
  document.getElementById('courseDetailName').textContent = c.name;
  document.getElementById('courseDetailMeta').textContent = c.schedule;

  const list = document.getElementById('courseArenaList');
  list.innerHTML = '';
  if(c.activeArenas.length===0){
    list.innerHTML = '<div class="course-arena-empty">目前沒有進行中的競賽，等老師開賽後會顯示在這裡。</div>';
  }else{
    c.activeArenas.forEach(a=>{
      const row = document.createElement('div');
      row.className = 'course-arena-card';
      row.innerHTML = '<div><div class="t">'+a.title+'</div><div class="d">'+a.status+'</div></div><button class="hint-btn sm">加入賽場</button>';
      row.querySelector('button').addEventListener('click', enrolled
        ? enterArena
        : ()=> showSystemToast('您並非本堂課學生，無法加入。'));
      list.appendChild(row);
    });
  }

  const rosterGrid = document.getElementById('courseRosterGrid');
  const rosterWarning = document.getElementById('courseRosterWarning');
  if(enrolled){
    rosterWarning.style.display = 'none';
    rosterGrid.style.display = 'grid';
    renderRoster(id);
  }else{
    rosterGrid.style.display = 'none';
    rosterGrid.innerHTML = '';
    rosterWarning.style.display = 'block';
  }
  renderTeacherRoster(id);
  goto('course-detail', {courseId:id});
}

function renderRoster(courseId){
  const grid = document.getElementById('courseRosterGrid');
  grid.innerHTML = '';
  const list = (CLASSMATES[courseId] || []).slice().sort((a,b)=>{
    if(a.isSelf) return -1;
    if(b.isSelf) return 1;
    return surnameStrokeCount(a.name) - surnameStrokeCount(b.name);
  });
  list.forEach(s=>{
    const name = s.isSelf ? MY_NAME : s.name;
    const card = document.createElement('div');
    card.className = 'roster-card';
    card.innerHTML = '<div class="roster-avatar" style="background:'+avatarColorFor(name)+'">'+name.charAt(0)+'</div>'
      +'<div class="roster-name">'+name+(s.isSelf?'（你）':'')+'</div>';
    card.addEventListener('click', ()=> loadStudentDetailAndGoto(s.id, courseId));
    grid.appendChild(card);
  });
}

function renderTeacherRoster(courseId){
  const grid = document.getElementById('courseTeacherGrid');
  grid.innerHTML = '';
  const c = findCourseById(courseId);
  c.teacherIds.forEach(teacherId=>{
    const t = TEACHERS[teacherId];
    const card = document.createElement('div');
    card.className = 'roster-card';
    card.innerHTML = '<div class="roster-avatar" style="background:'+avatarColorFor(t.name)+'">'+t.name.charAt(0)+'</div>'
      +'<div class="roster-name">'+t.name+'</div>';
    card.addEventListener('click', ()=> loadTeacherDetailAndGoto(teacherId));
    grid.appendChild(card);
  });
}

function sdRow(label, value){
  return '<div class="sd-row"><span class="sd-label">'+label+'</span><span class="sd-value">'+value+'</span></div>';
}

function loadStudentDetailAndGoto(studentId, courseId){
  const s = (CLASSMATES[courseId] || []).find(x=>x.id===studentId);
  const isSelf = !!(s && s.isSelf);
  const name = isSelf ? MY_NAME : s.name;

  document.getElementById('sdAvatar').textContent = name.charAt(0);
  document.getElementById('sdAvatar').style.background = avatarColorFor(name);
  document.getElementById('sdName').textContent = name + (isSelf ? '（你）' : '');

  const vis = isSelf
    ? {
        studentId: document.getElementById('visStudentId').checked,
        email: document.getElementById('visEmail').checked,
        bio: document.getElementById('visBio').checked,
        d4: document.getElementById('vis4D').checked,
        practice: document.getElementById('visPractice').checked,
        competition: document.getElementById('visCompetition').checked,
      }
    : s.visible;
  const bio = isSelf ? savedMyBio : s.bio;
  const scores = isSelf ? MY_SCORES : s.scores;
  const practiceSummary = isSelf ? MY_PRACTICE_SUMMARY : s.practice;
  const competitionSummary = isSelf ? MY_COMPETITION_SUMMARY : s.competition;

  const bioPanel = document.getElementById('sdBioPanel');
  if(vis.bio && bio){
    bioPanel.style.display = 'block';
    document.getElementById('sdBioText').textContent = bio;
  }else{
    bioPanel.style.display = 'none';
  }

  let infoHtml = '';
  if(vis.studentId){ infoHtml += sdRow('學號', isSelf ? MY_STUDENT_ID : s.studentId); }
  if(vis.email){ infoHtml += sdRow('Email', isSelf ? MY_EMAIL : s.email); }
  document.getElementById('sdInfoList').innerHTML = infoHtml || '<div class="sd-empty">這位同學沒有公開其他基本資料。</div>';

  const statsPanel = document.getElementById('sdStatsPanel');
  if(vis.d4){
    statsPanel.style.display = 'block';
    const dims = [['d1','委託',scores.d1],['d2','描述',scores.d2],['d3','辨識',scores.d3],['d4','盡責',scores.d4]];
    document.getElementById('sdRadar').innerHTML = dims.map(([k,label,val])=>
      '<div class="row"><span class="lbl" style="color:var(--'+k+')">'+label+'</span><div class="track"><div class="fill" style="width:'+val+'%;background:var(--'+k+')"></div></div><span class="pct">'+val+'%</span></div>'
    ).join('');
  }else{
    statsPanel.style.display = 'none';
  }

  let recordsHtml = '';
  if(vis.practice){ recordsHtml += '<div class="panel" style="margin-bottom:16px;"><div class="eyebrow">教學面練習紀錄</div><div class="sd-record-line">'+practiceSummary+'</div></div>'; }
  if(vis.competition){ recordsHtml += '<div class="panel" style="margin-bottom:16px;"><div class="eyebrow">競賽面表現紀錄</div><div class="sd-record-line">'+competitionSummary+'</div></div>'; }
  document.getElementById('sdRecordsList').innerHTML = recordsHtml;

  goto('student-detail', {studentId:studentId, courseId:courseId});
}

function loadTeacherDetailAndGoto(teacherId){
  const t = TEACHERS[teacherId];
  document.getElementById('tdAvatar').textContent = t.name.charAt(0);
  document.getElementById('tdAvatar').style.background = avatarColorFor(t.name);
  document.getElementById('tdName').textContent = t.name;
  document.getElementById('tdTitle').textContent = t.title+'・'+t.dept;
  document.getElementById('tdInfoList').innerHTML = sdRow('Email', t.email);

  const taughtCourses = allCoursesList().filter(c=>c.teacherIds.includes(teacherId));
  const listEl = document.getElementById('tdCourseList');
  if(taughtCourses.length===0){
    listEl.innerHTML = '<div class="sd-empty">目前沒有課程紀錄。</div>';
  }else{
    listEl.innerHTML = '';
    taughtCourses.forEach(c=>{
      const row = document.createElement('div');
      row.className = 'sd-record-line sd-course-link';
      row.textContent = c.name;
      row.addEventListener('click', ()=> loadCourseAndGoto(c.id));
      listEl.appendChild(row);
    });
  }

  goto('teacher-detail', {teacherId:teacherId});
}

/* ---------- navigation ---------- */
function goto(id, navParams){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  document.querySelectorAll('.sb-link[data-goto]').forEach(l=>{
    const match = l.dataset.goto===id || (l.dataset.goto==='courses' && (id==='course-detail' || id==='student-detail' || id==='teacher-detail'));
    l.classList.toggle('active', match);
  });
  const titles = {
    'home':['練習題','選一題開始練習，跟 AI 多輪對話完成任務'],
    'courses':['我的課程','選一門課程，查看目前正在進行的競賽'],
    'course-detail':['課程詳情','進行中的競賽與作業'],
    'student-detail':['學生詳情','這位同學公開的個人資料'],
    'teacher-detail':['教師詳情','這位教師的基本資料與開課紀錄'],
    'dojo':['作答中','跟 AI 多輪對話，完成這一題'],
    'arena-student':['競賽進行中','商業兩難競技場 · 學生視角'],
    'results-student':['競賽結束','成績與集體知識地圖'],
    'history':['競賽紀錄','你參加過的商業兩難競技場，點開查看當時的完整回饋'],
    'profile':['個人資料','基本資料與 4D 能力報表'],
    'settings':['設定','帳號、通知與隱私設定'],
  };
  const t = titles[id] || ['',''];
  document.getElementById('crumbTitle').innerHTML = t[0]+'<span class="sub">'+t[1]+'</span>';
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='arena-student'){
    clearTimeout(window._autoHintT);
    window._autoHintT = setTimeout(showTeacherHint, 2600);
  }
  if(id==='profile'){ renderPracticeLog(); }
  saveNavState(id, navParams);
}
/* 重新整理網頁後要留在原本的畫面，不要跳回首頁：把目前畫面（與需要的 id）存到 localStorage */
function saveNavState(id, navParams){
  try{
    localStorage.setItem('studentProtoNav', JSON.stringify({screen:id, params:navParams||null}));
  }catch(e){}
}
document.querySelectorAll('[data-goto]').forEach(el=>{
  el.addEventListener('click', ()=>{
    if(el.dataset.problem){ loadProblemAndGoto(el.dataset.problem); }
    else{ goto(el.dataset.goto); }
  });
});
document.getElementById('dojoBack').addEventListener('click', ()=> goto('home'));
document.getElementById('endCompBtn').addEventListener('click', ()=>{
  stopMatchTimer();
  hasActiveMatch = false;
  goto('results-student');
});

/* ---------- topbar 個人資料捷徑（複製側邊欄的頭貼／用戶名／等級，點擊跳轉個人資料） ---------- */
document.getElementById('topbarProfile').addEventListener('click', ()=> goto('profile'));
document.getElementById('topbarProfile').addEventListener('keydown', (e)=>{
  if(e.key==='Enter' || e.key===' '){ e.preventDefault(); goto('profile'); }
});

/* ---------- sidebar collapse: hides the whole column, hamburger brings it back ---------- */
document.getElementById('sbToggle').addEventListener('click', ()=>{
  document.body.classList.add('sidebar-collapsed');
});
document.getElementById('hamburgerBtn').addEventListener('click', ()=>{
  document.body.classList.remove('sidebar-collapsed');
});

/* ---------- mascot / code modal (only entry to arena) ---------- */
const veil = document.getElementById('codeVeil');
const mascotLabel = document.getElementById('mascotLabel');

function openCodeModal(){
  document.getElementById('codeInput').value = '';
  veil.classList.add('show');
}
function resetArenaDemoState(){
  isArenaPaused = false;
  isRep = true;
  document.getElementById('pauseBtn').textContent = '（Demo）教師暫停競賽';
  document.getElementById('pauseBanner').classList.remove('show');
  document.getElementById('draftInput').readOnly = false;
  document.getElementById('draftSubmitBtn').disabled = false;
  document.getElementById('draftSubmitBtn').textContent = '送交 AI 整合';
  document.getElementById('afterDraft').classList.remove('show');
  document.getElementById('arenaSubmitRow').style.display = 'flex';
  document.getElementById('arenaSubmittedBanner').style.display = 'none';
  currentSubQ = 3;
  renderSubQ();
  renderChatRole();
}
let _screenBeforeArena = null;
function enterArena(){
  if(!document.body.classList.contains('in-arena')){
    // 記錄進賽場前待在哪個畫面，「賽場出口」要回去原本那頁，不是統一跳回首頁
    const activeScreen = document.querySelector('.screen.active');
    _screenBeforeArena = activeScreen ? activeScreen.id.replace('screen-','') : 'home';
  }
  document.body.classList.add('in-arena');
  mascotLabel.textContent = '賽場出口';
  if(!hasActiveMatch){
    // 只有真的開始一場「新」比賽才重置——中途離開再回來要接續原本進度，
    // 不然會跟教師端與其他隊友的實際進度不同步。
    hasActiveMatch = true;
    resetArenaDemoState();
    matchSecondsLeft = 22*60+15;
    warnedFiveMin = false;
    renderMatchTimer();
    startMatchTimer();
  }
  goto('arena-student');
}
function exitArena(){
  // 比賽仍在後台繼續進行（倒數不停），只是先離開畫面，回來時會接續原本進度。
  document.body.classList.remove('in-arena');
  mascotLabel.textContent = '賽場入口';
  goto(_screenBeforeArena || 'home');
}

document.getElementById('mascotBtn').addEventListener('click', ()=>{
  if(document.body.classList.contains('in-arena')){ exitArena(); }
  else{ openCodeModal(); }
});
document.getElementById('codeCancel').addEventListener('click', ()=> veil.classList.remove('show'));
document.getElementById('codeJoin').addEventListener('click', ()=>{
  const v = document.getElementById('codeInput').value.trim();
  if(v.length>0){ veil.classList.remove('show'); enterArena(); }
});

/* ---------- teacher hint (demo, shown on student side) ---------- */
function showTeacherHint(){
  const t = document.getElementById('studentToast');
  document.getElementById('studentToastBody').textContent = '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？';
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('show'), 4200);
}
document.getElementById('replayHintBtn').addEventListener('click', showTeacherHint);
document.getElementById('caseAccToggle').addEventListener('click', ()=>{
  const body = document.getElementById('caseAccBody');
  body.classList.toggle('open');
  document.getElementById('caseAccArrow').textContent = body.classList.contains('open') ? '▴' : '▾';
});

/* ---------- system toast (time warning / pause / extend) ---------- */
function showSystemToast(text){
  const t = document.getElementById('systemToast');
  document.getElementById('systemToastBody').textContent = text;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('show'), 4200);
}

/* ---------- sub-question switcher ---------- */
const SUBQ_TITLES = {1:'釐清利害關係人與問題全貌', 2:'提出應對方案與替代選項', 3:'量化財務／營運影響'};
let currentSubQ = 3;
function renderSubQ(){
  document.getElementById('subqHeading').textContent = '第 '+currentSubQ+' 小題（共 3 題）：'+SUBQ_TITLES[currentSubQ];
  document.querySelectorAll('.subq-tab').forEach(btn=>{
    btn.classList.toggle('active', Number(btn.dataset.subq)===currentSubQ);
  });
}
document.querySelectorAll('.subq-tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{ currentSubQ = Number(btn.dataset.subq); renderSubQ(); });
});

/* ---------- whole-match countdown ---------- */
let hasActiveMatch = false;
let matchSecondsLeft = 22*60+15;
let matchTimerInterval = null;
let isArenaPaused = false;
let warnedFiveMin = false;
function formatTime(s){
  const m = Math.floor(s/60), sec = s%60;
  return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}
function renderMatchTimer(){
  document.getElementById('matchTimer').textContent = formatTime(Math.max(matchSecondsLeft,0));
}
function startMatchTimer(){
  stopMatchTimer();
  matchTimerInterval = setInterval(()=>{
    if(isArenaPaused || matchSecondsLeft<=0) return;
    matchSecondsLeft--;
    renderMatchTimer();
    if(matchSecondsLeft===300 && !warnedFiveMin){
      warnedFiveMin = true;
      showSystemToast('時間剩五分鐘，請盡快請 AI 彙整小組解方！');
    }
  }, 1000);
}
function stopMatchTimer(){
  if(matchTimerInterval){ clearInterval(matchTimerInterval); matchTimerInterval = null; }
}
document.getElementById('pauseBtn').addEventListener('click', ()=>{
  isArenaPaused = !isArenaPaused;
  document.getElementById('pauseBanner').classList.toggle('show', isArenaPaused);
  document.getElementById('pauseBtn').textContent = isArenaPaused ? '（Demo）教師恢復競賽' : '（Demo）教師暫停競賽';
  showSystemToast(isArenaPaused ? '競賽已暫停' : '競賽已恢復');
});
document.getElementById('extendBtn').addEventListener('click', ()=>{
  matchSecondsLeft += 120;
  renderMatchTimer();
  showSystemToast('教師已為全班加時');
});

/* ---------- draft -> AI diff card -> shared chat ---------- */
document.getElementById('draftSubmitBtn').addEventListener('click', function(){
  const draftInput = document.getElementById('draftInput');
  if(containsBannedWord(draftInput.value)){ showSystemToast('內容包含不適當字詞，請修改後再送出。'); return; }
  draftInput.readOnly = true;
  this.disabled = true;
  this.textContent = '已送交 AI 整合';
  document.getElementById('afterDraft').classList.add('show');
});
let isRep = true;
function renderChatRole(){
  const tag = document.getElementById('chatRoleTag');
  const inputRow = document.getElementById('chatInputRow');
  const note = document.getElementById('chatReadonlyNote');
  if(isRep){
    tag.textContent = '· 你是本題代表，可以輸入';
    inputRow.style.display = 'flex';
    note.style.display = 'none';
  }else{
    tag.textContent = '· 你目前是唯讀';
    inputRow.style.display = 'none';
    note.style.display = 'block';
  }
}
document.getElementById('chatRoleToggleBtn').addEventListener('click', ()=>{
  isRep = !isRep;
  renderChatRole();
});
document.getElementById('chatSendBtn').addEventListener('click', ()=>{
  const input = document.getElementById('chatInput');
  const val = input.value.trim();
  if(!val || !isRep) return;
  if(containsBannedWord(val)){ showSystemToast('內容包含不適當字詞，請修改後再送出。'); return; }
  const chat = document.getElementById('sharedChat');
  const div = document.createElement('div');
  div.className = 'chat-msg rep';
  div.innerHTML = '<b>你（代表）：</b>'+val;
  chat.appendChild(div);
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
});

/* ---------- 個人結果提交（competition 的「提交」，鎖定這回合的投票候選） ---------- */
document.getElementById('arenaSubmitBtn').addEventListener('click', ()=>{
  openConfirm('提交個人結果？', '提交後，目前聊天室裡的最終結果就是你這回合的個人結果，會送去給組內匿名投票。', ()=>{
    document.getElementById('arenaSubmitRow').style.display = 'none';
    document.getElementById('arenaSubmittedBanner').style.display = 'block';
    showSystemToast('已提交個人結果');
  });
});

/* ---------- problem list (題目列表頁，依難度分組) ---------- */
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5v-7z" fill="currentColor" stroke="none"/></svg>';
const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const ICON_EMPTY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
function problemStatus(id){ return getPracticeState(id).status; }
function renderProblemLists(){
  TIERS.forEach((tier,tIdx)=>{
    const unlocked = isTierUnlocked(tier.id);
    const listEl = document.getElementById('tierList-'+tier.id);
    const groupEl = document.getElementById('tierGroup-'+tier.id);
    const progressEl = document.getElementById('tierProgress-'+tier.id);
    groupEl.classList.toggle('locked', !unlocked);
    const ids = Object.keys(PROBLEMS).filter(id=>PROBLEMS[id].tier===tier.id);
    if(!unlocked){
      const prevTier = TIERS[tIdx-1];
      const have = completedCountInTier(prevTier.id);
      progressEl.textContent = '完成 '+TIER_UNLOCK_N+' 題「'+prevTier.label+'」後解鎖（目前 '+Math.min(have,TIER_UNLOCK_N)+' / '+TIER_UNLOCK_N+'）';
    }else{
      const done = ids.filter(id=>problemStatus(id)==='completed').length;
      progressEl.textContent = '已完成 '+done+' / '+ids.length+' 題';
    }
    if(ids.length===0){
      listEl.innerHTML = '<div class="sd-empty">這個難度目前還沒有題目。</div>';
      return;
    }
    listEl.innerHTML = '';
    ids.forEach(id=>{
      const problem = PROBLEMS[id];
      const status = unlocked ? problemStatus(id) : 'locked';
      const row = document.createElement('div');
      row.className = 'problem-row '+status;
      let icon, color;
      if(status==='completed'){ icon=ICON_CHECK; color='var(--d3)'; }
      else if(status==='locked'){ icon=ICON_LOCK; color='var(--ink-faint)'; }
      else if(status==='in-progress'){ icon=ICON_PLAY; color='var(--d2)'; }
      else{ icon=ICON_EMPTY; color='var(--ink-soft)'; }
      const continueTag = status==='in-progress' ? '<span class="prow-continue">繼續</span>' : '';
      row.innerHTML = '<span class="prow-status" style="color:'+color+'">'+icon+'</span>'
        +'<span class="prow-title">'+problem.title+continueTag+'</span>'
        +'<span class="prow-diff '+tier.diffClass+'">'+tier.label+'</span>';
      if(unlocked){ row.addEventListener('click', ()=> loadProblemAndGoto(id)); }
      listEl.appendChild(row);
    });
  });
}
function updateUnlocksAndMaybeRerenderList(){ renderProblemLists(); }

/* ---------- answer page (作答頁，多輪對話 + 階梯提示 + 回合結果) ---------- */
let currentProblemId = null;
let _aiPending = false;

function isProblemClickable(id){ return isTierUnlocked(PROBLEMS[id].tier); }
function loadProblemAndGoto(id){
  if(!isProblemClickable(id)) return;
  currentProblemId = id;
  renderDojo();
  goto('dojo', {problemId:id});
}

function generateAIReply(problem, isFirstInRound){
  if(isFirstInRound){
    return '（示範用 AI 回覆）好的，這是我根據你的提示整理的'+problem.outcomeType+'草稿。（提醒：這是前端示範用的固定文字，正式串接 AI 後會依你的實際輸入即時生成。）';
  }
  return '（示範用 AI 回覆）已經根據你的補充調整如上。（同樣是示範用的固定文字，正式版會依對話內容即時生成。）';
}

/* 回合 2 以後，每則 AI 回覆模擬偵測一個還沒出現過的行為（不打分，只用於即時標籤） */
function pickLiveTag(){
  const problem = PROBLEMS[currentProblemId];
  const state = getPracticeState(currentProblemId);
  const detected = new Set(state.messages.filter(m=>m.liveTag).map(m=>m.liveTag.label));
  const next = problem.indicators.find(ind=>!detected.has(ind.label));
  return next ? {label:next.label, dim:next.dim} : null;
}
function renderChatThread(){
  const state = getPracticeState(currentProblemId);
  const wrap = document.getElementById('chatThread');
  if(state.messages.length===0){
    wrap.innerHTML = '<div class="chat-empty">送出第一則訊息，開始跟 AI 對話吧。</div>';
    return;
  }
  wrap.innerHTML = state.messages.map((m,i)=>{
    let cls = 'chat-bubble '+m.role;
    if(m.pending) cls += ' pending';
    if(m.failed) cls += ' failed';
    let body = m.text.replace(/\n/g,'<br>');
    if(m.failed){ body += '<br><span class="retry-link" data-retry="'+i+'">重試</span>'; }
    if(m.liveTag){
      body += '<div class="live-tags"><span class="live-tag" data-info-label="'+m.liveTag.label.replace(/"/g,'&quot;')+'">偵測到：'+m.liveTag.label+'</span></div>'
        +'<div class="live-note-banner">即時偵測，不是正式分數</div>';
    }
    return '<div class="'+cls+'" data-msg-index="'+i+'">'+body+'</div>';
  }).join('');
  wrap.querySelectorAll('.retry-link').forEach(el=>{
    el.addEventListener('click', ()=> retryMessage(Number(el.dataset.retry)));
  });
  wrap.querySelectorAll('.live-tag').forEach(el=>{
    el.addEventListener('click', ()=> openIndicatorInfo(el.dataset.infoLabel, '你這則對話中的回覆，展現了「'+el.dataset.infoLabel+'」這個行為。'));
  });
  wrap.scrollTop = wrap.scrollHeight;
}
function renderObservedPanel(){
  const state = getPracticeState(currentProblemId);
  const panel = document.getElementById('observedPanel');
  if(state.round<2){ panel.style.display='none'; return; }
  panel.style.display = 'block';
  const seen = [];
  const seenLabels = new Set();
  state.messages.forEach(m=>{
    if(m.liveTag && !seenLabels.has(m.liveTag.label)){ seenLabels.add(m.liveTag.label); seen.push(m.liveTag); }
  });
  const wrap = document.getElementById('observedTags');
  wrap.innerHTML = seen.length
    ? '<div class="live-tags">'+seen.map(t=>'<span class="live-tag" data-info-label="'+t.label.replace(/"/g,'&quot;')+'">'+t.label+'</span>').join('')+'</div>'
    : '<div class="observed-empty">還沒有觀察到行為，繼續跟 AI 對話看看。</div>';
  wrap.querySelectorAll('.live-tag').forEach(el=>{
    el.addEventListener('click', ()=> openIndicatorInfo(el.dataset.infoLabel, '這是你這回合目前展現過的行為之一。'));
  });
}
function scrollToMessage(idx){
  const el = document.querySelector('.chat-bubble[data-msg-index="'+idx+'"]');
  if(!el) return;
  el.scrollIntoView({behavior:'smooth', block:'center'});
  el.classList.add('highlight');
  setTimeout(()=>el.classList.remove('highlight'), 1600);
}
function setGeneratingUI(isPending){
  _aiPending = isPending;
  const roundEnded = getPracticeState(currentProblemId).roundEnded;
  document.getElementById('chatPromptInput').disabled = isPending || roundEnded;
  document.getElementById('chatPromptSendBtn').disabled = isPending || roundEnded;
}
function maybeShowAiSuggestBar(){
  const state = getPracticeState(currentProblemId);
  const bar = document.getElementById('aiSuggestBar');
  const show = state.round>=2 && !state.roundEnded && state.userMsgCountThisRound>=2 && !state.aiSuggestDismissedThisRound;
  bar.classList.toggle('show', show);
}
function sendPrompt(){
  const state = getPracticeState(currentProblemId);
  if(state.roundEnded || _aiPending) return;
  const input = document.getElementById('chatPromptInput');
  const val = input.value.trim();
  if(!val) return;
  if(containsBannedWord(val)){ showSystemToast('內容包含不適當字詞，請修改後再送出。'); return; }
  state.messages.push({role:'user', text:val});
  state.userMsgCountThisRound++;
  input.value = '';
  const isFirstInRound = state.userMsgCountThisRound===1;
  state.messages.push({role:'ai', text:'思考中…', pending:true});
  const pendingIndex = state.messages.length-1;
  renderChatThread();
  setGeneratingUI(true);
  setTimeout(()=> resolveAIReply(pendingIndex, isFirstInRound), 700);
}
function resolveAIReply(pendingIndex, isFirstInRound){
  const state = getPracticeState(currentProblemId);
  const problem = PROBLEMS[currentProblemId];
  const msg = state.messages[pendingIndex];
  if(!msg) return;
  if(!_demoFailureShown){
    _demoFailureShown = true;
    msg.pending = false; msg.failed = true; msg.text = '（示範用）這次 AI 回覆沒有成功，請重試。';
  }else{
    msg.pending = false; msg.failed = false;
    msg.text = generateAIReply(problem, isFirstInRound);
    if(state.round>=2){ msg.liveTag = pickLiveTag(); }
  }
  renderChatThread();
  renderObservedPanel();
  setGeneratingUI(false);
  maybeShowAiSuggestBar();
}
function retryMessage(idx){
  const state = getPracticeState(currentProblemId);
  const problem = PROBLEMS[currentProblemId];
  const msg = state.messages[idx];
  if(!msg) return;
  msg.pending = true; msg.failed = false; msg.text = '思考中…';
  renderChatThread();
  setGeneratingUI(true);
  setTimeout(()=>{
    msg.pending = false;
    msg.text = generateAIReply(problem, idx<=1);
    if(state.round>=2){ msg.liveTag = pickLiveTag(); }
    renderChatThread();
    renderObservedPanel();
    setGeneratingUI(false);
    maybeShowAiSuggestBar();
  }, 700);
}

/* ---------- confirm modal (重開 / 要提示 確認視窗，共用) ---------- */
let _confirmAction = null;
function openConfirm(title, body, onConfirm){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent = body;
  _confirmAction = onConfirm;
  document.getElementById('confirmVeil').classList.add('show');
}
document.getElementById('confirmCancel').addEventListener('click', ()=>{
  document.getElementById('confirmVeil').classList.remove('show'); _confirmAction = null;
});
document.getElementById('confirmOk').addEventListener('click', ()=>{
  document.getElementById('confirmVeil').classList.remove('show');
  const fn = _confirmAction; _confirmAction = null;
  if(fn) fn();
});

/* ---------- 指標說明彈窗（「什麼是這個？」）：定義＋好例子＋壞例子，固定內容、不呼叫 AI ---------- */
function openIndicatorInfo(label, liveNote){
  const info = indicatorInfoFor(label);
  document.getElementById('indicatorInfoTitle').textContent = label;
  let html = '';
  if(liveNote){ html += '<div class="live-note">'+liveNote+'</div>'; }
  html += '<div class="row"><div class="label">定義</div><div>'+info.def+'</div></div>';
  html += '<div class="row"><div class="label">好例子</div><div>'+info.good+'</div></div>';
  html += '<div class="row"><div class="label">壞例子</div><div>'+info.bad+'</div></div>';
  document.getElementById('indicatorInfoBody').innerHTML = html;
  document.getElementById('indicatorInfoVeil').classList.add('show');
}
document.getElementById('indicatorInfoClose').addEventListener('click', ()=>{
  document.getElementById('indicatorInfoVeil').classList.remove('show');
});

/* ---------- round actions: 重開 / 要提示 / 提交成果 ---------- */
function confirmRestart(){
  const state = getPracticeState(currentProblemId);
  openConfirm('重開這回合？', '重開會放棄目前這段對話，不會被評分。回合 '+state.round+' 重開後仍是回合 '+state.round+'，可以一直重開。', doRestart);
}
function doRestart(){
  const state = getPracticeState(currentProblemId);
  state.messages = []; state.userMsgCountThisRound = 0; state.aiSuggestDismissedThisRound = false;
  renderDojo();
}
function confirmHintRound1(){
  openConfirm('要提示？', '取得提示會結束目前這個回合並評分，接著開啟新的對話。', endRoundViaHint);
}
function endRoundViaHint(){
  const state = getPracticeState(currentProblemId);
  const problem = PROBLEMS[currentProblemId];
  const evidenceIdx = state.messages.findIndex(m=>m.role==='user');
  const result = computeRoundResult(problem, state.round, evidenceIdx>=0?evidenceIdx:null);
  state.roundsHistory.push(Object.assign({endedBy:'hint', hidden:true}, result));
  state.observationShown = true;
  applyRoundEndStatus(result);
  advanceRound(true);
}
function viewHintAdvance(){ advanceRound(true); }
function revealHintInPlace(){
  const state = getPracticeState(currentProblemId);
  state.hintRevealed = true; state.hintLevelOpen = Math.max(state.hintLevelOpen,1);
  renderDojo();
}
function startNextRoundNoHint(){ advanceRound(false); }
function advanceRound(revealHint){
  const state = getPracticeState(currentProblemId);
  state.round += 1; state.roundEnded = false; state.endedBy = null;
  state.messages = []; state.userMsgCountThisRound = 0; state.aiSuggestDismissedThisRound = false;
  if(state.status!=='completed') state.status = 'in-progress';
  if(revealHint){ state.hintRevealed = true; state.hintLevelOpen = Math.max(state.hintLevelOpen,1); }
  renderDojo();
}
function applyRoundEndStatus(result){
  const state = getPracticeState(currentProblemId);
  if(result.completed){ state.status = 'completed'; }
  else if(state.status==='not-started'){ state.status = 'in-progress'; }
  updateUnlocksAndMaybeRerenderList();
}

/* ---------- submit panel（提交成果） ---------- */
function openSubmitPanel(){
  const state = getPracticeState(currentProblemId);
  if(state.roundEnded || _aiPending) return;
  openConfirm('提交成果？', '提交後這個回合會結束並評分。', doOpenSubmitPanel);
}
function doOpenSubmitPanel(){
  const problem = PROBLEMS[currentProblemId];
  document.getElementById('submitOutcomeType').textContent = problem.outcomeType;
  document.getElementById('submitTextarea').value = '';
  document.getElementById('submitVeil').classList.add('show');
}
document.getElementById('submitCancel').addEventListener('click', ()=>{
  document.getElementById('submitVeil').classList.remove('show');
});
document.getElementById('submitConfirm').addEventListener('click', ()=>{
  const val = document.getElementById('submitTextarea').value.trim();
  if(containsBannedWord(val)){ showSystemToast('內容包含不適當字詞，請修改後再送出。'); return; }
  const state = getPracticeState(currentProblemId);
  const problem = PROBLEMS[currentProblemId];
  const evidenceIdx = state.messages.findIndex(m=>m.role==='user');
  const result = computeRoundResult(problem, state.round, evidenceIdx>=0?evidenceIdx:null);
  state.roundEnded = true; state.endedBy = 'submit'; state.observationShown = true;
  state.roundsHistory.push(Object.assign({endedBy:'submit', hidden:false, submittedText:val}, result));
  applyRoundEndStatus(result);
  document.getElementById('submitVeil').classList.remove('show');
  renderDojo();
});

/* ---------- 回合結果面板 ---------- */
function indicatorBadgeInfo(score){
  if(score==='unseen') return {cls:'unseen', text:'未觀察到'};
  if(score===2) return {cls:'s2', text:'做到了'};
  if(score===1) return {cls:'s1', text:'部分做到'};
  return {cls:'s0', text:'還沒做到'};
}
function indicatorReasonText(score){
  if(score==='unseen') return '這個回合還沒出現機會展現這項行為。';
  if(score===2) return '這個回合的提示有清楚做到這一點。';
  if(score===1) return '這個回合有稍微提到，但還不夠具體或完整。';
  return '這個回合的提示還沒有做到這一點。';
}
function indicatorRowHtml(r, includeEvidence){
  const b = indicatorBadgeInfo(r.score);
  const reason = indicatorReasonText(r.score);
  const evidence = (includeEvidence && r.evidenceMsgIndex!=null && r.score!=='unseen')
    ? '<span class="indicator-evidence" data-msg="'+r.evidenceMsgIndex+'">查看對話中的依據 →</span>' : '';
  return '<div class="indicator-row"><div class="indicator-top">'
    +'<span class="indicator-name-wrap"><span class="indicator-name">'+r.label+'</span>'
    +'<button type="button" class="info-icon" data-info-label="'+r.label.replace(/"/g,'&quot;')+'" aria-label="什麼是這個？" title="什麼是這個？">i</button></span>'
    +'<span class="indicator-badge '+b.cls+'">'+b.text+'</span></div>'
    +'<div class="indicator-reason">'+reason+'</div>'+evidence+'</div>';
}
function dimFeedbackHtml(indicatorResults){
  const dims = {};
  indicatorResults.forEach(r=>{ (dims[r.dim]=dims[r.dim]||[]).push(r.score); });
  let html = '<div class="dim-feedback">';
  Object.keys(dims).forEach(dimKey=>{
    html += '<div class="dim-feedback-row"><div class="dim-feedback-label" style="color:var(--'+dimKey+')">'+DIM_NAMES[dimKey]+'</div>'
      +'<div class="dim-feedback-text">'+dimFeedbackText(dimKey, dims[dimKey])+'</div></div>';
  });
  html += '</div>';
  return html;
}
function roundResultBlockHtml(entry, includeEvidence){
  let html = '<div class="eyebrow">回合 '+entry.round+' 結果</div>';
  html += '<div class="result-check '+(entry.completed?'pass':'fail')+'">'+(entry.completed?'✓ 已達標':'還沒達標')+'</div>';
  if(!entry.completed && entry.unmet.length){
    html += '<ul class="result-unmet">'+entry.unmet.map(t=>'<li>未達成：'+t+'</li>').join('')+'</ul>';
  }
  html += '<div class="indicator-list">'+entry.indicatorResults.map(r=>indicatorRowHtml(r, includeEvidence)).join('')+'</div>';
  html += dimFeedbackHtml(entry.indicatorResults);
  return html;
}
function renderResultPanel(){
  const panel = document.getElementById('resultPanel');
  const state = getPracticeState(currentProblemId);
  const problem = PROBLEMS[currentProblemId];
  const showIt = state.roundEnded && state.endedBy==='submit';
  if(!showIt){ panel.style.display='none'; return; }
  panel.style.display = 'block';
  const lastIdx = state.roundsHistory.length-1;
  const entry = state.roundsHistory[lastIdx];
  const prev = state.roundsHistory[lastIdx-1];
  let html = '';
  // 回合 1 以「要提示」結束時先只記錄、不顯示；等下一回合提交後，兩回合的結果一起顯示
  // （上一回合的對話已經不在畫面上了，所以那一輪的指標不提供「查看對話中的依據」連結）
  if(prev && prev.hidden && prev.round===entry.round-1){
    html += roundResultBlockHtml(prev, false);
    html += '<div style="height:1px;background:var(--line);margin:18px 0;"></div>';
    html += roundResultBlockHtml(entry, true);
  }else{
    html += roundResultBlockHtml(entry, true);
  }
  html += '<div class="trap-note" style="margin-top:16px;">'+problem.observation+'</div>';
  let nextBtns = '';
  if(!state.hintRevealed){ nextBtns += '<button class="hint-btn sm" id="resultViewHintBtn">查看提示</button>'; }
  nextBtns += '<button class="hint-btn ghost sm" id="resultNextRoundBtn">再來一回合</button>';
  if(state.status==='completed'){ nextBtns += '<button class="hint-btn ghost sm" id="resultBackToListBtn">回題目列表</button>'; }
  html += '<div class="result-next-row">'+nextBtns+'</div>';
  document.getElementById('resultBody').innerHTML = html;
  const vb = document.getElementById('resultViewHintBtn'); if(vb) vb.addEventListener('click', viewHintAdvance);
  document.getElementById('resultNextRoundBtn').addEventListener('click', startNextRoundNoHint);
  const bb = document.getElementById('resultBackToListBtn'); if(bb) bb.addEventListener('click', ()=> goto('home'));
  panel.querySelectorAll('.indicator-evidence').forEach(el=>{
    el.addEventListener('click', ()=> scrollToMessage(Number(el.dataset.msg)));
  });
  panel.querySelectorAll('.info-icon[data-info-label]').forEach(el=>{
    el.addEventListener('click', ()=> openIndicatorInfo(el.dataset.infoLabel));
  });
}

/* ---------- 提示區（三級階梯提示） ---------- */
/* 提示要一級一級解鎖：第 1 級解鎖時可點開，點開後才解鎖第 2 級，以此類推 */
function refreshHintLockUI(){
  const state = getPracticeState(currentProblemId);
  document.querySelectorAll('#hintLevels .hint-level-toggle').forEach(btn=>{
    const level = Number(btn.dataset.level);
    const locked = level >= state.hintLevelOpen;
    btn.disabled = locked;
    btn.classList.toggle('locked', locked);
  });
}
function ensureHintLadderBuilt(){
  const ladder = document.getElementById('hintLadder');
  if(ladder.dataset.builtFor === currentProblemId){ refreshHintLockUI(); return; }
  ladder.dataset.builtFor = currentProblemId;
  const problem = PROBLEMS[currentProblemId];
  const state = getPracticeState(currentProblemId);
  const levelsWrap = document.getElementById('hintLevels');
  const labels = ['提醒要考慮什麼','帶空格的模板','完整範例'];
  levelsWrap.innerHTML = problem.hints.map((text,i)=>
    '<div class="hint-level">'
    +'<button type="button" class="hint-level-toggle" data-level="'+i+'">第 '+(i+1)+' 級 · '+labels[i]+'</button>'
    +'<div class="hint-level-body'+(i===0?' open':'')+'" id="hintBody-'+i+'">'+text+'</div>'
    +'</div>'
  ).join('');
  // 第 1 級一開始就是展開狀態，視同已經讀過，立刻解鎖第 2 級；第 3 級要等點開第 2 級才解鎖
  if(state.hintLevelOpen < 2 && problem.hints.length >= 2){ state.hintLevelOpen = 2; }
  levelsWrap.querySelectorAll('.hint-level-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const state = getPracticeState(currentProblemId);
      const level = Number(btn.dataset.level);
      if(level >= state.hintLevelOpen) return; // 還沒解鎖，不能點開
      const body = document.getElementById('hintBody-'+level);
      const opening = !body.classList.contains('open');
      body.classList.toggle('open');
      if(opening && level === state.hintLevelOpen-1 && state.hintLevelOpen < problem.hints.length){
        state.hintLevelOpen++;
        refreshHintLockUI();
      }
    });
  });
  refreshHintLockUI();
}
function renderHintLadderVisibility(){
  const state = getPracticeState(currentProblemId);
  const ladder = document.getElementById('hintLadder');
  if(!state.hintRevealed){ ladder.style.display='none'; return; }
  ladder.style.display = 'block';
  ensureHintLadderBuilt();
}

/* ---------- action row (重開 / 要提示 / 提交成果) ---------- */
function renderActions(){
  const state = getPracticeState(currentProblemId);
  const restartBtn = document.getElementById('pqRestartBtn');
  const hintBtn = document.getElementById('pqHintBtn');
  const submitBtn = document.getElementById('pqSubmitBtn');

  restartBtn.textContent = state.roundEnded ? '再來一回合' : '重開';
  restartBtn.onclick = state.roundEnded ? startNextRoundNoHint : confirmRestart;

  if(!state.hintRevealed){
    hintBtn.style.display = 'inline-block';
    if(state.round===1 && !state.roundEnded){ hintBtn.textContent='要提示'; hintBtn.onclick=confirmHintRound1; }
    else if(state.roundEnded){ hintBtn.textContent='查看提示'; hintBtn.onclick=viewHintAdvance; }
    else{ hintBtn.textContent='查看提示'; hintBtn.onclick=revealHintInPlace; }
  }else{
    hintBtn.style.display = 'none';
  }

  submitBtn.disabled = state.roundEnded;
  submitBtn.textContent = state.roundEnded ? '已提交' : '提交成果';
}
document.getElementById('pqSubmitBtn').addEventListener('click', openSubmitPanel);
document.getElementById('chatPromptSendBtn').addEventListener('click', sendPrompt);
document.getElementById('aiSuggestCloseBtn').addEventListener('click', ()=>{
  getPracticeState(currentProblemId).aiSuggestDismissedThisRound = true;
  document.getElementById('aiSuggestBar').classList.remove('show');
});
document.getElementById('aiSuggestSubmitBtn').addEventListener('click', openSubmitPanel);

/* ---------- 作答頁整頁重繪 ---------- */
function renderDojo(){
  const problem = PROBLEMS[currentProblemId];
  const state = getPracticeState(currentProblemId);
  const tierInfo = TIERS.find(t=>t.id===problem.tier);

  document.getElementById('taskTag').textContent = tierInfo.label+'難度';
  document.getElementById('taskTag').className = 'brief-tag '+tierInfo.diffClass;
  document.getElementById('taskTitle').textContent = problem.title;
  document.getElementById('taskOutcome').innerHTML = '成果類型：<b>'+problem.outcomeType+'</b>';
  document.getElementById('taskBrief').textContent = problem.scenario;
  const obsEl = document.getElementById('taskObservation');
  if(state.observationShown){ obsEl.style.display='block'; obsEl.textContent = problem.observation; }
  else{ obsEl.style.display='none'; }

  document.getElementById('roundPill').textContent = '回合 '+state.round;
  const stateLabel = document.getElementById('roundStateLabel');
  stateLabel.textContent = state.roundEnded ? '已結束' : '進行中';
  stateLabel.classList.toggle('ended', state.roundEnded);

  const hintNote = document.getElementById('roundHintNote');
  const prevEntry = state.roundsHistory[state.roundsHistory.length-1];
  hintNote.style.display = (prevEntry && prevEntry.hidden && prevEntry.round === state.round-1) ? 'block' : 'none';

  document.getElementById('chatPromptInput').value = '';
  renderChatThread();
  renderObservedPanel();
  maybeShowAiSuggestBar();
  setGeneratingUI(false);

  renderActions();
  renderHintLadderVisibility();
  renderResultPanel();
}

/* ---------- results tabs ---------- */
document.querySelectorAll('.res-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    const group = tab.closest('section');
    group.querySelectorAll('.res-tab').forEach(t=>t.classList.remove('active'));
    group.querySelectorAll('.res-view').forEach(v=>v.classList.remove('active'));
    tab.classList.add('active');
    group.querySelector('#res-'+tab.dataset.res).classList.add('active');
  });
});

/* ---------- peer comment demo ---------- */
function addPeerComment(team){
  const input = document.getElementById('peerInput'+team);
  const val = input.value.trim();
  if(!val) return;
  if(containsBannedWord(val)){ showSystemToast('內容包含不適當字詞，請修改後再送出。'); return; }
  const list = document.getElementById('peerList'+team);
  const div = document.createElement('div');
  div.className='peer-comment';
  div.innerHTML = '<b>C 隊（你）：</b>'+val;
  list.appendChild(div);
  input.value='';
}

/* ---------- history expand ---------- */
document.querySelectorAll('.hist-head').forEach(h=>{
  h.addEventListener('click', ()=>{
    document.getElementById('hist-'+h.dataset.hist).classList.toggle('open');
  });
});

/* ---------- personal bio (個人簡介)：預設瀏覽模式，點鉛筆才進入編輯 ---------- */
const bioInput = document.getElementById('bioInput');
const bioCount = document.getElementById('bioCount');
bioInput.addEventListener('input', ()=>{
  bioCount.textContent = bioInput.value.length+' / 200';
});
function renderBioView(){
  const el = document.getElementById('bioViewText');
  const text = savedMyBio.trim();
  if(text){ el.textContent = text; el.classList.remove('empty'); }
  else{ el.textContent = '尚未填寫個人簡介。'; el.classList.add('empty'); }
}
function enterBioEditMode(){
  bioInput.value = savedMyBio;
  bioCount.textContent = bioInput.value.length+' / 200';
  document.getElementById('bioModerationNote').classList.remove('show');
  document.getElementById('bioViewRow').style.display = 'none';
  document.getElementById('bioEditWrap').style.display = 'block';
  bioInput.focus();
}
function exitBioEditMode(){
  document.getElementById('bioEditWrap').style.display = 'none';
  document.getElementById('bioViewRow').style.display = 'flex';
  renderBioView();
}
document.getElementById('bioEditBtn').addEventListener('click', enterBioEditMode);
document.getElementById('bioSaveBtn').addEventListener('click', ()=>{
  const val = bioInput.value.trim();
  const note = document.getElementById('bioModerationNote');
  if(containsBannedWord(val)){
    note.classList.add('show');
    return;
  }
  note.classList.remove('show');
  savedMyBio = val;
  showSystemToast('已儲存個人簡介');
  exitBioEditMode();
});
renderBioView();

/* ---------- 設定：顯示名稱 ---------- */
document.getElementById('displayNameSaveBtn').addEventListener('click', ()=>{
  const input = document.getElementById('displayNameInput');
  const val = input.value.trim();
  if(!val){ showSystemToast('顯示名稱不能是空的。'); return; }
  if(containsBannedWord(val)){ showSystemToast('內容包含不適當字詞，請修改後再儲存。'); return; }
  MY_NAME = val;
  input.value = val;
  document.getElementById('sbName').textContent = val;
  document.getElementById('sbAvatar').textContent = val.charAt(0);
  document.getElementById('profileName').textContent = val;
  document.getElementById('profileAvatar').textContent = val.charAt(0);
  document.getElementById('topbarName').textContent = val;
  document.getElementById('topbarAvatar').textContent = val.charAt(0);
  showSystemToast('已儲存顯示名稱');
});

/* ---------- 設定：Email ---------- */
document.getElementById('emailSaveBtn').addEventListener('click', ()=>{
  const input = document.getElementById('emailInput');
  const val = input.value.trim();
  if(!val){ showSystemToast('Email 不能是空的。'); return; }
  MY_EMAIL = val;
  input.value = val;
  showSystemToast('已儲存 Email');
});

/* ---------- 設定：深色／淺色模式（預設淺色） ---------- */
document.getElementById('darkModeToggle').addEventListener('change', function(){
  document.documentElement.setAttribute('data-theme', this.checked ? 'dark' : 'light');
});

/* ---------- 個人能力頁：教學面練習紀錄（題目名稱／難度／完成狀態／回合數，可展開看各回合回饋） ---------- */
const PRACTICE_STATUS_LABEL = {'in-progress':'進行中', 'completed':'已完成'};
function renderPracticeLog(){
  const wrap = document.getElementById('practiceLogList');
  if(!wrap) return;
  const ids = Object.keys(PROBLEMS).filter(id=>getPracticeState(id).status!=='not-started');
  if(ids.length===0){ wrap.innerHTML = '<div class="sd-empty">目前還沒有練習紀錄，去「練習題」挑一題開始吧。</div>'; return; }
  wrap.innerHTML = ids.map((id,idx)=>{
    const problem = PROBLEMS[id];
    const state = getPracticeState(id);
    const tier = TIERS.find(t=>t.id===problem.tier);
    const historyHtml = state.roundsHistory.map(h=>{
      const statusLabel = h.completed ? '已達標' : '還沒達標';
      const label = h.hidden ? ('要提示後進入下一回合（'+statusLabel+'）') : statusLabel;
      return '<div class="hist-feedback"><b>回合 '+h.round+'：</b>'+label+'</div>';
    }).join('');
    return '<div class="hist-card">'
      +'<div class="hist-head" data-plog="'+idx+'"><div><div class="t">'+problem.title+'</div>'
      +'<div class="meta">難度：'+tier.label+' · 回合數：'+state.roundsHistory.length+'</div></div>'
      +'<div class="hist-rank">'+PRACTICE_STATUS_LABEL[state.status]+'</div></div>'
      +'<div class="hist-body" id="plog-'+idx+'"><div class="hist-body-inner">'+(historyHtml||'<div class="sd-empty">尚無回合紀錄。</div>')+'</div></div>'
      +'</div>';
  }).join('');
  wrap.querySelectorAll('.hist-head[data-plog]').forEach(h=>{
    h.addEventListener('click', ()=> document.getElementById('plog-'+h.dataset.plog).classList.toggle('open'));
  });
}

/* ---------- 示範用初始進度（讓頁面一開始就有「已完成」與「進行中」各種狀態可看） ---------- */
(function seedDemoProgress(){
  ['bank1','bank2'].forEach(id=>{
    const problem = PROBLEMS[id];
    const st = getPracticeState(id);
    st.round = 2; st.roundEnded = true; st.endedBy = 'submit'; st.observationShown = true;
    st.hintRevealed = true; st.hintLevelOpen = 1;
    st.messages = [
      {role:'user', text:'（示範資料）這是我練習時送出的提示。'},
      {role:'ai', text:generateAIReply(problem, true)},
    ];
    const round2Result = computeRoundResult(problem, 2, 0);
    st.roundsHistory = [
      Object.assign({endedBy:'hint', hidden:true}, computeRoundResult(problem, 1, 0)),
      Object.assign({endedBy:'submit', hidden:false, submittedText:'（示範資料）已提交成果'}, round2Result),
    ];
    st.status = round2Result.completed ? 'completed' : 'in-progress';
  });
  (function seedIntro(){
    const id = 'p-intro';
    const problem = PROBLEMS[id];
    const st = getPracticeState(id);
    st.round = 2; st.roundEnded = false; st.endedBy = null; st.observationShown = true;
    st.hintRevealed = true; st.hintLevelOpen = 1;
    st.messages = [
      {role:'user', text:'請幫我寫一則系學會活動的公告。'},
      {role:'ai', text:generateAIReply(problem, true)},
    ];
    st.userMsgCountThisRound = 1;
    st.roundsHistory = [
      Object.assign({endedBy:'hint', hidden:true}, computeRoundResult(problem, 1, 0)),
    ];
    if(st.status==='not-started') st.status = 'in-progress';
  })();
  renderProblemLists();
})();

/* ---------- 重新整理網頁後留在原本的畫面，不要跳回首頁 ---------- */
(function restoreNavState(){
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem('studentProtoNav') || 'null'); }catch(e){}
  if(!saved || !saved.screen) return;
  const p = saved.params || {};
  switch(saved.screen){
    case 'courses': goto('courses'); break;
    case 'history': goto('history'); break;
    case 'profile': goto('profile'); break;
    case 'settings': goto('settings'); break;
    case 'course-detail': if(p.courseId) loadCourseAndGoto(p.courseId); break;
    case 'student-detail': if(p.studentId) loadStudentDetailAndGoto(p.studentId, p.courseId); break;
    case 'teacher-detail': if(p.teacherId) loadTeacherDetailAndGoto(p.teacherId); break;
    case 'dojo': if(p.problemId) loadProblemAndGoto(p.problemId); break;
    // 其餘畫面（例如賽場、競賽結果）仰賴只存在記憶體裡的比賽狀態，重新整理後無法還原，
    // 就不特別處理，留在預設的首頁即可。
  }
})();
