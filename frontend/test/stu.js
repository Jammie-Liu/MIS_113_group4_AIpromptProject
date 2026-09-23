/* ---------- task data ---------- */
const TASKS = {
  complaint: {
    tag:'第 4 關 · 白銀難度', title:'客訴回覆信改寫', preview:false,
    brief:'你是行銷部窗口。一位顧客因物流延誤寫信抱怨，語氣強硬並要求全額退款。主管請你先請 AI 幫忙，把回覆信改得更專業、更能安撫顧客，同時你需要決定「退款與否」最終由誰拍板。',
    trap:'🔎 這一關會觀察：你有沒有意識到「退款決策」不該完全交給 AI 自己決定。',
    prefill:'幫我把這封客訴信回得更委婉、更專業一點，語氣不要太生硬，讓顧客消消氣。',
    scores:{d1:34,d2:71,d3:40,d4:58},
    checklist:[
      {ok:true, text:'範圍界定：有說明要改寫語氣'},
      {ok:false, text:'能力判斷：沒有意識到「退款與否」不該讓 AI 直接決定'},
      {ok:false, text:'保留把關：提示中沒有要求 AI 列出選項供你最終拍板'},
    ],
    rewrite:'「幫我把這封客訴信改得更專業、口氣更能安撫顧客，<mark>但先不要承諾退款</mark>——<mark>請條列出 2 個可能的處理方向</mark>（例如補償優惠券／加速換貨），<mark>並標明哪些是妳需要跟主管確認的部分</mark>，讓我最後自己決定要用哪一個。」'
  },
  ethics: {
    tag:'第 6 關 · 倫理收束（demo 預覽）', title:'方案裡的隱藏代價', preview:true,
    brief:'AI 依你先前的提示，建議「裁減 10% 人力以降低成本」作為主要方案。這一關要練習如何用提示引導 AI，在維持方案可行性的同時，一併提出並評估這個方案對員工、品牌信任的倫理風險，並思考揭露策略。',
    trap:'🔎 這一關會觀察：你的提示有沒有主動要求 AI 揭露潛在倫理風險，而不是照單全收「裁員＝省成本」這個單一結論。',
    prefill:'請你把裁員方案的細節寫更清楚一點，包括名單怎麼排序。',
    scores:{d1:45,d2:60,d3:35,d4:22},
    checklist:[
      {ok:false, text:'倫理風險意識：沒有要求 AI 評估對員工士氣與品牌信任的影響'},
      {ok:false, text:'揭露誠實：沒有提到後續要怎麼向員工／外部溝通這個決策'},
      {ok:true, text:'格式明確：有具體要求列出名單排序邏輯'},
    ],
    rewrite:'「在維持成本目標的前提下，請AI先列出裁員方案<mark>對員工士氣、外部品牌信任可能造成的三個風險</mark>，並<mark>提出至少一個能降低這些風險的溝通／緩衝作法</mark>，最後才補充名單排序邏輯。」'
  },
  bank1: {
    tag:'題庫 · 青銅難度', title:'會議效率提案', preview:true,
    brief:'你的部門想縮短每週例會時間，但不想犧牲重要討論品質。請 AI 幫忙發想至少兩個具體做法。',
    trap:'🔎 這一關會觀察：你的提示有沒有給 AI 足夠脈絡（目前會議多長、參加人數、常見討論主題），而不是只丟一句籠統的「幫我想辦法」。',
    prefill:'幫我想辦法讓開會變快一點。',
    scores:{d1:50,d2:38,d3:45,d4:60},
    checklist:[
      {ok:false, text:'脈絡完整：沒有說明目前會議時長、人數或常見議題'},
      {ok:false, text:'格式／限制：沒有要求列出具體數量或評估方式'},
      {ok:true, text:'目標明確：有講清楚「縮短時間又不犧牲品質」這個目標'},
    ],
    rewrite:'「我們部門目前每週例會 90 分鐘、10 人參加，常常花很多時間在單向報告。請 AI 提出至少兩個具體做法，能把會議縮短到 60 分鐘以內，同時保留重要討論的時間，<mark>並用條列式列出優缺點</mark>。」'
  },
  bank2: {
    tag:'題庫 · 青銅難度', title:'新人培訓方案', preview:true,
    brief:'公司想設計一套新人一週內能上手的訓練流程，請 AI 提出規劃架構。',
    trap:'🔎 這一關會觀察：有沒有指定新人背景／職位，避免 AI 給出過於籠統的訓練表。',
    prefill:'幫我規劃一個新人訓練計畫。',
    scores:{d1:40,d2:33,d3:40,d4:55},
    checklist:[
      {ok:false, text:'脈絡完整：沒有說明新人的職位或部門'},
      {ok:false, text:'格式／限制：沒有指定要輸出成表格或每日行程'},
      {ok:true, text:'目標明確：有講清楚一週內上手這個時限'},
    ],
    rewrite:'「我們要幫新加入的<mark>客服專員</mark>設計一週訓練計畫，<mark>請用每日行程表的格式列出</mark>，每天包含 1 個學習重點與 1 個實作練習。」'
  },
  bank3: {
    tag:'題庫 · 白銀難度', title:'內部獎勵制度', preview:true,
    brief:'HR 想推出低成本但有感的員工獎勵方案，請 AI 發想三個可行方向。',
    trap:'🔎 這一關會觀察：你有沒有意識到「最終要不要採用」該由 HR 團隊決定，AI 只負責發想不做決策。',
    prefill:'幫我想三個員工獎勵方案，然後直接告訴我哪個最好，我們就用哪個。',
    scores:{d1:20,d2:55,d3:40,d4:45},
    checklist:[
      {ok:false, text:'保留把關：提示要求 AI 直接「告訴我哪個最好、我們就用哪個」，把最終決策交給了 AI'},
      {ok:false, text:'能力判斷：沒有請 AI 標示每個方案需要 HR 自行確認的前提假設（例如預算上限）'},
      {ok:true, text:'目標明確：有清楚要求三個可行方向'},
    ],
    rewrite:'「幫我發想三個低成本但員工有感的獎勵方案，<mark>每個方案請標出可能需要的預算範圍與潛在風險</mark>，我會和 HR 團隊一起討論後<mark>再決定要採用哪一個</mark>。」'
  },
  bank4: {
    tag:'題庫 · 黃金難度', title:'客服 SOP 優化', preview:true,
    brief:'客服團隊常常被同樣的問題卡住，請 AI 幫忙設計一份可以縮短處理時間的應對指南草案。',
    trap:'🔎 這一關會觀察：你有沒有要求 AI 標示哪些應對方式是「AI 自己推測」、哪些是有實際準則支持。',
    prefill:'幫我寫一份客服應對指南，把常見問題的標準回答都列出來。',
    scores:{d1:48,d2:62,d3:25,d4:50},
    checklist:[
      {ok:true, text:'格式／限制：有要求列出常見問題與標準回答'},
      {ok:false, text:'要求佐證：沒有要求 AI 說明這些應對方式的依據來源'},
      {ok:false, text:'事後查核：沒有對 AI 生成的內容進一步提出質疑或驗證'},
    ],
    rewrite:'「幫我草擬一份客服應對指南，針對常見問題列出建議回答，<mark>並請你標明哪些是根據一般客服準則、哪些只是你的推測</mark>——推測的部分我需要再跟資深客服確認過才會採用。」'
  },
  bank5: {
    tag:'題庫 · 白銀難度', title:'跨部門溝通落差', preview:true,
    brief:'業務與工程部門常常資訊不同步，請 AI 提出一個低成本的溝通機制建議。',
    trap:'🔎 這一關會觀察：有沒有讓 AI 了解問題實際發生在哪個環節，而不是憑空建議。',
    prefill:'業務跟工程常常搞不清楚彼此在幹嘛，幫我想個辦法。',
    scores:{d1:42,d2:30,d3:38,d4:48},
    checklist:[
      {ok:false, text:'脈絡完整：沒有具體說明資訊不同步的情境（例如需求變更沒同步、進度看板沒更新）'},
      {ok:false, text:'格式／限制：沒有限制輸出格式或數量'},
      {ok:true, text:'目標明確：有講清楚要「低成本」的溝通機制'},
    ],
    rewrite:'「業務常常在需求變更後沒有即時同步給工程端，導致進度誤判。請 AI 提出一個低成本、不需要額外開會的溝通機制建議，<mark>用條列式列出至少兩個做法並說明適用情境</mark>。」'
  },
  bank6: {
    tag:'題庫 · 鑽石難度（模擬競賽情境）', title:'老字號手搖飲品牌轉型兩難', preview:true,
    brief:'「甜心堂」是經營 20 年的手搖飲連鎖品牌，全台有 120 家分店。近年手搖飲市場競爭激烈，年輕消費者轉向手作精品咖啡與低糖健康飲品，甜心堂的營收連續三年下滑。行銷部提出「全面轉型健康低糖路線」，但研發與供應鏈需要至少 8 個月才能完成配方與供應商調整；財務部則擔心轉型期間流失既有重糖客群，導致現金流吃緊。你是策略顧問，需要用 AI 協助評估這個轉型決策。任務：請 AI 幫你評估「全面轉型」與「漸進式雙軌並行」兩個路線的優劣，並指出至少一個你認為 AI 分析中可能忽略的風險。',
    trap:'🔎 這一關會觀察：你的提示有沒有要求 AI 同時考慮短期現金流與長期品牌定位兩個時間尺度，而不是只回答其中一個。',
    prefill:'幫我評估甜心堂要不要轉型做健康飲料。',
    scores:{d1:38,d2:35,d3:30,d4:40},
    checklist:[
      {ok:false, text:'脈絡完整：沒有帶入題目給的關鍵限制（8 個月轉型期、既有重糖客群流失風險）'},
      {ok:false, text:'格式／限制：沒有要求 AI 比較至少兩個路線並各自列出優劣'},
      {ok:false, text:'要求查核：沒有要求 AI 指出分析中可能忽略的風險或假設'},
    ],
    rewrite:'「甜心堂手搖飲品牌考慮轉型健康低糖路線，但研發需要 8 個月、轉型期間可能流失既有重糖客群。請比較『全面轉型』與『漸進式雙軌並行』兩個路線的優劣，<mark>並明確指出你的分析中有哪些是基於假設、可能被我忽略的風險</mark>，最後我會再跟財務與行銷團隊一起討論定案。」'
  },
  bank7: {
    tag:'題庫 · 鑽石難度（模擬競賽情境）', title:'新創公司募資兩難', preview:true,
    brief:'一家 B2B SaaS 新創目前月營收成長穩定，但現金僅夠再撐 4 個月。天使輪投資人願意加碼，但要求提高持股比例並取得董事會否決權；同時有一家策略型企業客戶提出併購意向，估值略低於天使輪但可立即解決現金危機並綁定大客戶。你是創辦人的顧問，要協助評估。任務：請 AI 分析「接受加碼但讓出否決權」與「被併購」兩個選項對公司長期自主性與團隊的影響，並要求 AI 標示它無法確定的變數。',
    trap:'🔎 這一關會觀察：你有沒有意識到「最終決定該由創辦人與董事會決定」，AI 只能輔助分析不能替你做決定；以及有沒有要求 AI 標示它無法確定的變數。',
    prefill:'幫我分析要不要接受併購，然後告訴我該選哪個。',
    scores:{d1:15,d2:50,d3:28,d4:44},
    checklist:[
      {ok:false, text:'保留把關：提示要求 AI「告訴我該選哪個」，把最終決策交給了 AI'},
      {ok:false, text:'要求標示不確定性：沒有要求 AI 標出它無法確定的變數（如未來成長率、併購方後續策略）'},
      {ok:true, text:'目標明確：有清楚提出要分析兩個選項'},
    ],
    rewrite:'「請分析『接受天使輪加碼但讓出董事會否決權』與『被策略型企業併購』這兩個選項，對公司長期自主性與團隊的影響，<mark>並標示出哪些是你無法確定、需要我再跟董事會確認的變數</mark>——最終決定我會跟共同創辦人一起討論後再拍板。」'
  },
};
const BANK_LIST = [
  {id:'bank1', diff:'bronze', diffLabel:'青銅', t:'會議效率提案', d:'幫部門想辦法把每週例會縮短，但不犧牲討論品質。'},
  {id:'bank2', diff:'bronze', diffLabel:'青銅', t:'新人培訓方案', d:'設計一套讓新人一週內上手的訓練流程架構。'},
  {id:'bank3', diff:'silver', diffLabel:'白銀', t:'內部獎勵制度', d:'發想低成本但員工有感的獎勵方案，練習保留最終決策權。'},
  {id:'bank4', diff:'gold', diffLabel:'黃金', t:'客服 SOP 優化', d:'設計客服應對指南草案，練習要求 AI 標示推測與依據。'},
  {id:'bank5', diff:'silver', diffLabel:'白銀', t:'跨部門溝通落差', d:'提出低成本的跨部門溝通機制建議。'},
  {id:'bank6', diff:'diamond', diffLabel:'鑽石', t:'老字號手搖飲品牌轉型兩難', d:'完整商業情境練習，模擬競賽等級的複雜兩難決策。'},
  {id:'bank7', diff:'diamond', diffLabel:'鑽石', t:'新創公司募資兩難', d:'完整商業情境練習，模擬競賽等級的複雜兩難決策。'},
];
const bankGrid = document.getElementById('bankGrid');
BANK_LIST.forEach(item=>{
  const card=document.createElement('div');
  card.className='bank-card';
  card.innerHTML = '<span class="diff '+item.diff+'">'+item.diffLabel+'難度</span><div class="t">'+item.t+'</div><div class="d">'+item.d+'</div><div class="go">開始練習 →</div>';
  card.addEventListener('click', ()=> loadTaskAndGoto(item.id));
  bankGrid.appendChild(card);
});

/* ---------- navigation ---------- */
function goto(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  document.querySelectorAll('.sb-link[data-goto]').forEach(l=>l.classList.toggle('active', l.dataset.goto===id));
  const titles = {
    'home':['首頁','歡迎回來，繼續你的提示訓練'],
    'bank':['解方發想題庫','挑一題開始練習'],
    'dojo':['關卡練習','正在挑戰這一關'],
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
}
document.querySelectorAll('[data-goto]').forEach(el=>{
  el.addEventListener('click', ()=>{
    if(el.dataset.task){ loadTaskAndGoto(el.dataset.task); }
    else{ goto(el.dataset.goto); }
  });
});
document.getElementById('dojoBack').addEventListener('click', ()=> goto('home'));
document.getElementById('endCompBtn').addEventListener('click', ()=> goto('results-student'));

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
function enterArena(){
  document.body.classList.add('in-arena');
  mascotLabel.textContent = '賽場出口';
  goto('arena-student');
}
function exitArena(){
  document.body.classList.remove('in-arena');
  mascotLabel.textContent = '賽場入口';
  goto('home');
}

document.getElementById('mascotBtn').addEventListener('click', ()=>{
  if(document.body.classList.contains('in-arena')){ exitArena(); }
  else{ openCodeModal(); }
});
document.getElementById('ctaMascot').addEventListener('click', openCodeModal);
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

/* ---------- task player ---------- */
let currentTaskId = 'complaint';
let attempt = 1;
function loadTaskAndGoto(id){
  currentTaskId = id;
  attempt = 1;
  const t = TASKS[id];
  document.getElementById('taskTag').textContent = t.tag;
  document.getElementById('taskTitle').textContent = t.title;
  document.getElementById('taskBrief').textContent = t.brief;
  document.getElementById('taskTrap').textContent = t.trap;
  document.getElementById('promptInput').value = t.prefill;
  document.getElementById('dojoPreviewBanner').style.display = t.preview ? 'block' : 'none';
  document.getElementById('attemptNo').textContent = 1;
  document.getElementById('scoreEmpty').style.display='block';
  document.getElementById('scoreBody').style.display='none';
  document.getElementById('rewriteBox').classList.remove('show');
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled=false; submitBtn.textContent='送出提示';
  goto('dojo');
}
document.getElementById('submitBtn').addEventListener('click', function(){
  if(attempt>3) return;
  const t = TASKS[currentTaskId];
  document.getElementById('attemptNo').textContent = attempt;
  document.getElementById('scoreEmpty').style.display='none';
  document.getElementById('scoreBody').style.display='block';
  ['d1','d2','d3','d4'].forEach(k=>{ document.getElementById('fill-'+k).style.width='0%'; document.getElementById('num-'+k).style.opacity=0; });
  document.getElementById('checklist').innerHTML='';
  document.getElementById('rewriteBox').classList.remove('show');
  document.getElementById('rewriteTxt').innerHTML = t.rewrite;
  setTimeout(()=>{
    ['d1','d2','d3','d4'].forEach((k,i)=>{
      setTimeout(()=>{
        document.getElementById('fill-'+k).style.width = t.scores[k]+'%';
        document.getElementById('num-'+k).textContent = t.scores[k];
        document.getElementById('num-'+k).style.opacity = 1;
      }, i*120);
    });
  },100);
  setTimeout(()=>{
    const cl = document.getElementById('checklist');
    t.checklist.forEach((item,i)=>{
      const div=document.createElement('div');
      div.className='check-item '+(item.ok?'pass':'fail');
      div.innerHTML = '<span class="mark">'+(item.ok?'✓':'✕')+'</span><span>'+item.text+'</span>';
      cl.appendChild(div);
      setTimeout(()=>div.classList.add('show'), i*140);
    });
  },700);
  setTimeout(()=>{ document.getElementById('rewriteBox').classList.add('show'); }, 1500);
  attempt++;
  if(attempt>3){ this.disabled=true; this.textContent='已達重下上限'; }
});

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