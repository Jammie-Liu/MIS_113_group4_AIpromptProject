const ICON = {
  lock: '<svg class="icon-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="9" rx="1.8"/><path d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8"/></svg>',
  globe: '<svg class="icon-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.2 3.7 5.2 3.7 8.5s-1.3 6.3-3.7 8.5c-2.4-2.2-3.7-5.2-3.7-8.5S9.6 5.7 12 3.5z"/></svg>',
  user: '<svg class="icon-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.3" r="3.4"/><path d="M5 19.5c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5"/></svg>',
  check: '<svg class="icon-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7.5 12.3 10.3 15l6-6.5"/></svg>',
  warning: '<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2 20.5h20z"/><path d="M12 9.5v4.6"/><path d="M12 17v.05"/></svg>',
  pause: '<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="5.5" y="4.5" width="4.3" height="15" rx="1"/><rect x="14.2" y="4.5" width="4.3" height="15" rx="1"/></svg>',
  play: '<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6.5 4.5v15l13-7.5z"/></svg>',
  menu: '<svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>',
  close: '<svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  expand: '<svg class="icon-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H5v4"/><path d="M15 19h4v-4"/><path d="M5 19l6-6"/><path d="M19 5l-6 6"/></svg>',
  trash: '<svg class="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15"/><path d="M9.5 7V5.2a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="M6.5 7l1 12.3a1.8 1.8 0 0 0 1.8 1.7h5.4a1.8 1.8 0 0 0 1.8-1.7L17.5 7"/><path d="M10 11v6M14 11v6"/></svg>',
};

/* ---------- sidebar collapse ---------- */
const sidebarEl = document.getElementById('sidebar');
const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
function setSidebarOpen(open){
  sidebarEl.classList.toggle('collapsed', !open);
  sidebarToggleIcon.innerHTML = open ? ICON.close : ICON.menu;
}
setSidebarOpen(false);
document.getElementById('sidebarToggle').addEventListener('click', ()=>{
  setSidebarOpen(sidebarEl.classList.contains('collapsed'));
});
function goto(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  document.querySelectorAll('.sb-link[data-goto]').forEach(l=>l.classList.toggle('active', l.dataset.goto===id));
  const titles = {
    'teacher-home':['首頁','你開設的所有課程'],
    'bank-manage':['題庫管理','系統提供給競賽使用的商業兩難案例題庫'],
    'course-detail':['課程管理', document.getElementById('courseTitle').textContent],
    'arena-teacher':['即時監控台','商業兩難競技場 · 教師視角'],
    'team-detail':['隊伍詳情','點開查看該隊完整即時狀況'],
    'results-teacher':['評分與總覽','競賽結束 · 教師視角'],
    'settings':['設定','個人資料、帳號、通知與競賽預設值'],
  };
  const t = titles[id];
  document.getElementById('crumbTitle').innerHTML = t[0]+'<span class="sub">'+t[1]+'</span>';
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-goto]').forEach(el=>{
  el.addEventListener('click', ()=>{
    if(el.dataset.course){ document.getElementById('courseTitle').textContent = el.querySelector('h3') ? el.querySelector('h3').textContent : document.getElementById('courseTitle').textContent; }
    goto(el.dataset.goto);
    if(el.closest('.sidebar')) setSidebarOpen(false);
  });
});

/* ---------- course setup ---------- */
function generateArenaCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<6;i++) code += chars[Math.floor(Math.random()*chars.length)];
  document.getElementById('genCode').textContent = code;
  document.getElementById('consoleCode').textContent = code;
  const link = 'https://promptarena.app/join/'+code;
  document.getElementById('joinLink').textContent = link;
  document.getElementById('qrImage').src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data='+encodeURIComponent(link);
  return code;
}
function copyText(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position='fixed'; ta.style.left='-9999px';
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); }catch(e){}
  document.body.removeChild(ta);
}
function flashCopyToast(msg){
  const toast = document.getElementById('copyToast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toast.classList.remove('show'), 1800);
}
document.getElementById('openSetupBtn').addEventListener('click', ()=>{
  openModal('setupModalOverlay');
  if(document.getElementById('genCode').textContent.trim()==='— — — — — —'){
    generateArenaCode();
  }
});
document.getElementById('copyCodeBtn').addEventListener('click', ()=>{
  copyText(document.getElementById('genCode').textContent.trim());
  flashCopyToast('已複製代碼');
});
document.getElementById('copyLinkBtn').addEventListener('click', ()=>{
  copyText(document.getElementById('joinLink').textContent.trim());
  flashCopyToast('已複製連結');
});
document.getElementById('showQrBtn').addEventListener('click', function(){
  const panel = document.getElementById('qrPanel');
  panel.classList.toggle('show');
  this.innerHTML = panel.classList.contains('show')
    ? this.innerHTML.replace('QR Code','隱藏 QR Code')
    : this.innerHTML.replace('隱藏 QR Code','QR Code');
});

/* ---------- rounds / time limit ---------- */
const FIXED_ROUNDS = 3;
const CASE_DEFAULTS = {
  '供應鏈勞動爭議（已備妥完整示範資料）': {time:8},
  '外送平台派單爭議（題庫建置中）': {time:8},
  '新品定價兩難（題庫建置中）': {time:10},
};
document.getElementById('caseSelect').addEventListener('change', function(){
  const d = CASE_DEFAULTS[this.value];
  if(d){
    document.getElementById('timeLimitSelect').value = d.time;
  }
});
document.getElementById('startConsoleBtn').addEventListener('click', ()=>{
  const caseSelect = document.getElementById('caseSelect');
  const caseName = caseSelect.value.replace(/(?:（|\().*$/,'').trim();
  const timeLimit = document.getElementById('timeLimitSelect').value;
  document.getElementById('consoleCaseName').textContent = caseName;
  document.getElementById('consoleRoundCur').textContent = '1';
  document.getElementById('consoleRoundTotal').textContent = FIXED_ROUNDS;
  document.getElementById('consoleTimeLimit').textContent = timeLimit;
  document.getElementById('statTime').textContent = String(timeLimit).padStart(2,'0')+':00';
  closeModal('setupModalOverlay');
  goto('arena-teacher');
});

document.getElementById('rosterToggle').addEventListener('click', ()=>{
  const body = document.getElementById('rosterBody');
  body.classList.toggle('open');
  document.getElementById('rosterArrow').textContent = body.classList.contains('open') ? '▴' : '▾';
});
document.querySelectorAll('.past-comp').forEach(el=>{
  el.addEventListener('click', ()=>{
    document.getElementById('pc-'+el.dataset.pc).classList.toggle('open');
  });
});

/* ---------- bank management ---------- */
const TEACHER_BANK = [
  {name:'供應鏈勞動爭議', diff:'黃金', industry:'電商 / 零售', source:'sys', publish:'public', rounds:3, owner:'系統預設',
    bg:'「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。',
    roles:'財務長：認為更換供應商將墊高短期成本並影響出貨穩定\n永續長：主張若不處理將重創品牌信任度\n人資長：擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層',
    gap:'供應商是否已著手改善尚未證實；更換供應商的實際交接時程與品質風險未知。',
    tension:'短期成本與出貨穩定 vs 品牌信任與倫理責任',
    checklist:['財務影響量化','員工／客戶影響評估','替代方案比較','執行時程與風險','倫理／法遵考量','溝通／揭露策略'],
    trap:'該產業平均違規率達 42%（無查證來源，屬幻覺陷阱範例）'},
  {name:'外送平台派單爭議兩難', diff:'白銀', industry:'物流平台', source:'sys', publish:'public', rounds:3, owner:'系統預設',
    bg:'「快送」是外送媒合平台，演算法派單以效率為核心指標，但外送員反映尖峰時段等待與超時罰款機制不合理，社群串連要求平台調整制度。',
    roles:'營運長：擔心調整演算法會拉長平均送達時間，影響用戶體驗\n外送員代表：要求透明化派單邏輯與合理的等待補償\n投資人：關注平台成長動能是否受影響',
    gap:'演算法實際邏輯屬商業機密，外部無法直接查核；外送員實際收入分布數據有限。',
    tension:'配送效率與平台成長 vs 外送員合理權益',
    checklist:['派單機制透明度','外送員收入影響評估','替代方案比較','執行時程與風險','品牌與公關風險','溝通／揭露策略'],
    trap:'外送員平均時薪較去年下降 30%（未經查證，屬幻覺陷阱範例）'},
  {name:'新品定價兩難', diff:'黃金', industry:'消費品', source:'sys', publish:'public', rounds:3, owner:'系統預設',
    bg:'某消費品牌即將推出新品，行銷部主張以低價快速搶市佔，財務部則堅持高毛利定價以維持品牌形象與獲利結構，雙方在上市前僵持不下。',
    roles:'行銷副理：主張低價策略搶佔市佔率\n財務長：堅持高毛利定價，擔心低價傷害品牌定位\n業務經理：擔心通路對定價策略的接受度',
    gap:'競品實際成本結構未知；低價策略對長期品牌價值的影響難以量化。',
    tension:'短期市佔率 vs 長期品牌與獲利健康',
    checklist:['市場定位分析','成本結構評估','替代方案比較（至少兩種定價策略）','通路接受度評估','長期品牌影響','溝通／揭露策略'],
    trap:'競品毛利率僅 8%（未經查證，屬幻覺陷阱範例）'},
  {name:'團隊留任 vs 派遣轉正', diff:'白銀', industry:'人力資源', source:'own', publish:'private', rounds:3, owner:'張欣綠（僅本人）',
    bg:'某部門有 5 名派遣人力已服務超過 2 年，部門主管希望轉正以留住熟練人力，但人事預算今年已被削減 15%，若全數轉正將排擠新進人力招募名額。',
    roles:'部門主管：希望轉正留住熟練人力\nHR：需在預算限制下平衡全公司人力配置\n派遣人力本人：期待穩定保障但尚未被告知決策方向',
    gap:'明年度預算是否會回升尚未確定；部分派遣人力是否有轉職意願未知。',
    tension:'留才穩定 vs 預算限制與公平性',
    checklist:['預算影響量化','員工士氣與留任率評估','替代方案比較（部分轉正／分階段轉正）','溝通與揭露策略'],
    trap:'（尚未標記已知幻覺陷阱）'},
];
function bankBadges(b){
  const srcBadge = b.source==='sys' ? '<span class="bic-badge sys">系統內建</span>' : '<span class="bic-badge sys" style="background:var(--paper);color:var(--ink-soft);">教師建立</span>';
  const pubBadge = b.publish==='public' ? '<span class="bic-badge pub">'+ICON.globe+' 公開（所有教師可用）</span>' : '<span class="bic-badge priv">'+ICON.lock+' 僅本人可用</span>';
  return srcBadge+pubBadge;
}
function renderBankList(){
  const wrap = document.getElementById('bankList');
  wrap.innerHTML = '';
  TEACHER_BANK.forEach((b,idx)=>{
    const card = document.createElement('div');
    card.className = 'bank-item-card';
    card.innerHTML =
      '<button class="bank-card-toggle" data-idx="'+idx+'">'
        +'<div class="top"><div class="name">'+b.name+'</div><span class="bic-badge diff">'+b.diff+'難度</span></div>'
        +'<div class="badges">'+bankBadges(b)+'</div>'
        +'<div class="desc">'+b.bg.slice(0,60)+'……</div>'
        +'<div class="meta2">回合數：'+b.rounds+' · 產業：'+b.industry+' · 建立者：'+b.owner+'　<span class="expand-arrow">'+ICON.expand+' 查看完整內容</span></div>'
      +'</button>';
    wrap.appendChild(card);
  });
  document.querySelectorAll('.bank-card-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=> openBankModal(parseInt(btn.dataset.idx,10)));
  });
}
renderBankList();

/* ---------- shared modal helpers ---------- */
function openModal(id){
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id){
  document.getElementById(id).classList.remove('show');
  if(!document.querySelector('.modal-overlay.show')) document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(overlay.id); });
  overlay.querySelector('.modal-close').addEventListener('click', ()=> closeModal(overlay.id));
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    document.querySelectorAll('.modal-overlay.show').forEach(o=> closeModal(o.id));
  }
});

/* ---------- logout confirm ---------- */
document.getElementById('logoutBtn').addEventListener('click', ()=> openModal('logoutModalOverlay'));
document.getElementById('logoutCancelBtn').addEventListener('click', ()=> closeModal('logoutModalOverlay'));
document.getElementById('logoutConfirmBtn').addEventListener('click', ()=>{
  closeModal('logoutModalOverlay');
});

/* ---------- bank detail modal ---------- */
function openBankModal(idx){
  const b = TEACHER_BANK[idx];
  const checklistChips = b.checklist.map(c=>'<span class="bank-detail-chip">'+c+'</span>').join('');
  document.getElementById('bankModalBody').innerHTML =
    '<div class="modal-head" id="bankModalTitle">'
      +'<div class="name">'+b.name+' <span class="bic-badge diff">'+b.diff+'難度</span></div>'
      +'<div class="badges">'+bankBadges(b)+'</div>'
    +'</div>'
    +'<div class="bank-detail-row"><div class="bdl">情境背景</div><div class="bdv">'+b.bg+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">角色與立場</div><div class="bdv" style="white-space:pre-line;">'+b.roles+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">資訊落差／限制</div><div class="bdv">'+b.gap+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">兩難張力</div><div class="bdv">'+b.tension+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">完整解方檢查清單</div><div class="bdv"><div class="bank-detail-chips">'+checklistChips+'</div></div></div>'
    +'<div class="bank-detail-row"><div class="bdl">已知幻覺陷阱</div><div class="bdv">'+b.trap+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">回合數</div><div class="bdv">'+b.rounds+' 回合</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">產業／情境類別</div><div class="bdv">'+b.industry+'</div></div>'
    +'<div class="bank-detail-row"><div class="bdl">公開狀態</div><div class="bdv">'+(b.publish==='public'?ICON.globe+' 公開（所有教師可用）':ICON.lock+' 僅本人可用')+'</div></div>'
    +'<div class="modal-danger-row">'
      +(b.source==='sys'
        ? '<span class="locked-note">'+ICON.lock+' 系統內建題庫，無法自行刪除</span>'
        : '<button class="hint-btn sm danger-btn" id="deleteBankBtn">'+ICON.trash+' 刪除這個題庫</button>')
    +'</div>';
  openModal('bankModalOverlay');
  const delBtn = document.getElementById('deleteBankBtn');
  if(delBtn){
    delBtn.addEventListener('click', ()=>{
      if(confirm('確定要刪除「'+b.name+'」這個題庫嗎？此動作無法復原。')){
        TEACHER_BANK.splice(idx,1);
        closeModal('bankModalOverlay');
        renderBankList();
      }
    });
  }
}

/* ---------- new case modal ---------- */
document.getElementById('openNewCaseBtn').addEventListener('click', ()=>{
  openModal('newCaseModalOverlay');
});
document.getElementById('createCaseBtn').addEventListener('click', ()=>{
  const name = document.getElementById('cfName').value.trim();
  if(!name){ document.getElementById('cfName').focus(); return; }
  const publish = document.querySelector('input[name=cfPublish]:checked').value;
  const checklistRaw = document.getElementById('cfChecklist').value.trim();
  const checklistArr = checklistRaw ? checklistRaw.split('\n').map(s=>s.trim()).filter(Boolean) : ['（尚未填寫檢查清單）'];
  TEACHER_BANK.unshift({
    name: name,
    diff: document.getElementById('cfDiff').value,
    industry: document.getElementById('cfIndustry').value || '未分類',
    source: 'own',
    publish: publish,
    rounds: FIXED_ROUNDS,
    owner: publish==='public' ? '張欣綠（公開）' : '張欣綠（僅本人）',
    bg: document.getElementById('cfBg').value || '（尚未填寫情境背景）',
    roles: document.getElementById('cfRoles').value || '（尚未填寫角色與立場）',
    gap: document.getElementById('cfGap').value || '（尚未填寫資訊落差／限制）',
    tension: document.getElementById('cfTension').value || '（尚未填寫兩難張力）',
    checklist: checklistArr,
    trap: document.getElementById('cfTrap').value || '（尚未標記已知幻覺陷阱）',
  });
  renderBankList();
  ['cfName','cfIndustry','cfBg','cfRoles','cfGap','cfTension','cfChecklist','cfTrap'].forEach(id=>{ document.getElementById(id).value=''; });
  closeModal('newCaseModalOverlay');
});

/* ---------- team summary data (console grid) ---------- */
const teams = [
  {name:'A 隊', status:'已送出', dot:'#5FB894', cov:64, flags:[]},
  {name:'B 隊', status:'討論中', dot:'#E7A857', cov:48, flags:[]},
  {name:'C 隊', status:'停滯中', dot:'#C1495B', cov:22, flags:[{t:'超過 90 秒無動作',c:'amber'}], stalled:true},
  {name:'D 隊', status:'已評分', dot:'#5FB894', cov:80, flags:[{t:'命中幻覺陷阱',c:'red'}], flagged:true},
  {name:'E 隊', status:'已送出', dot:'#5FB894', cov:56, flags:[]},
];
const grid = document.getElementById('teamGrid');
teams.forEach(t=>{
  const card=document.createElement('div');
  card.className='team-card'+(t.stalled?' stalled':'')+(t.flagged?' flagged':'');
  card.id = 'team-'+t.name;
  card.innerHTML = '<div class="team-top"><div class="team-name">'+t.name+'</div><div class="status-pill"><span class="status-dot" style="background:'+t.dot+'"></span>'+t.status+'</div></div>'
    +'<div class="cov-label">完整解方覆蓋率</div><div class="cov-track"><div class="cov-fill" id="covfill-'+t.name+'" style="width:'+t.cov+'%"></div></div>'
    +'<div class="team-flags">'+t.flags.map(f=>'<span class="flag '+f.c+'">'+f.t+'</span>').join('')+'</div>'
    +'<div class="go">點擊查看完整狀況 →</div>';
  card.addEventListener('click', ()=> openTeamDetail(t.name));
  grid.appendChild(card);
});

/* ---------- team detail data ---------- */
const TEAM_DETAIL = {
  'A 隊': {
    status:'已送出',
    prompts:[
      {who:'陳阿哲', txt:'請以財務長角度列出更換供應商的三個月現金流影響，並標出兩個可能被低估的隱藏成本。', score:79, rep:true, votes:3},
      {who:'林雅婷', txt:'先幫我查一下這個供應商過去有沒有被開罰過。', score:65, rep:false, votes:1},
    ],
    solution:'建議一：立即終止與現供應商的合約，改與通過我們稽核標準的新供應商簽約。\n預估影響：前三個月因交接與磨合，物流成本上升約 15%，但可避免持續的勞動爭議聲量擴大。\n建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。\n風險：更換供應商本身需要 4-6 週的過渡期，這段期間可能出現交貨延遲。\n（本隊尚未評估員工與現有供應商窗口的關係維護，這部分後續需要 HR 與採購共同討論。）',
    coverage:[
      {item:'財務影響量化', ok:true, note:'有具體數字（15%）與時間區間（三個月）'},
      {item:'替代方案比較', ok:false, note:'僅提出單一方案，缺乏與「維持現狀」的對照評估'},
      {item:'倫理／法遵考量', ok:true, note:'有提出罰則承諾書與第三方稽核機制'},
    ],
    hallucination:null,
  },
  'B 隊': {
    status:'討論中',
    prompts:[
      {who:'吳建宏', txt:'幫我比較維持現供應商加強稽核，跟直接換供應商，兩個方案的財務跟品牌風險。', score:71, rep:true, votes:2},
    ],
    solution:'建議採取分階段稽核：先要求供應商提供近一年的勞檢紀錄，若無法提供則視為違規，公司同步啟動備援供應商評估，但暫不終止現有合約，以降低短期斷貨風險。',
    coverage:[
      {item:'替代方案比較', ok:true, note:'有明確比較「加強稽核」與「更換供應商」兩條路徑'},
      {item:'財務影響量化', ok:false, note:'尚未提出具體數字'},
    ],
    hallucination:null,
  },
  'C 隊': {
    status:'停滯中',
    prompts:[
      {who:'王志明', txt:'這個供應商到底有沒有違反勞動法？幫我查一下。', score:54, rep:false, votes:0},
    ],
    solution:'（本隊在本回合送出提示前已超過時間上限，AI 尚未產出完整解方。）',
    coverage:[
      {item:'財務影響量化', ok:false, note:'尚未提出'},
      {item:'替代方案比較', ok:false, note:'尚未提出'},
    ],
    hallucination:null,
  },
  'D 隊': {
    status:'已評分',
    prompts:[
      {who:'黃冠廷', txt:'幫我把裁罰風險跟產業違規率整理一下，維持現供應商但加強稽核的方案。', score:58, rep:true, votes:2},
    ],
    solution:'建議：維持現供應商，但要求對方在 30 天內提出改善計畫，並加派稽核人力。\n根據我們查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決問題。\n若供應商未能在期限內改善，才考慮啟動備援供應商評估。',
    coverage:[
      {item:'替代方案比較', ok:true, note:'有提出「限期改善」與「啟動備援」兩階段方案'},
      {item:'溝通／揭露策略', ok:true, note:'有提及對供應商的溝通期限與後續處理'},
    ],
    hallucination:{claim:'該產業平均違規率達 42%', note:'查核後找不到原始來源，判定為幻覺內容，本項不計分並已要求該隊重新查核。'},
  },
  'E 隊': {
    status:'已送出',
    prompts:[
      {who:'許庭瑜', txt:'我們想先確認員工端的反應，幫我想一下要怎麼問 AI 評估員工士氣風險。', score:74, rep:true, votes:2},
    ],
    solution:'建議優先與員工／客服代表溝通，說明目前的因應方向與時程，再視稽核結果決定是否更換供應商；同時準備好對外聲明稿以因應可能的媒體詢問。',
    coverage:[
      {item:'員工／客戶影響評估', ok:true, note:'有明確聚焦在員工溝通與士氣風險'},
      {item:'溝通／揭露策略', ok:true, note:'有提出對外聲明稿的準備'},
    ],
    hallucination:null,
  },
};
function openTeamDetail(name){
  const d = TEAM_DETAIL[name];
  document.getElementById('tdTeamName').textContent = name;
  document.getElementById('tdStatus').textContent = d.status;
  const log = document.getElementById('tdPromptLog');
  log.innerHTML = '';
  const topPrompt = d.prompts.find(p=>p.rep) || d.prompts.slice().sort((a,b)=>b.votes-a.votes)[0];
  if(topPrompt){
    const div = document.createElement('div');
    div.className = 'prompt-log-item rep';
    div.innerHTML = '<div class="top"><span>'+ICON.user+' '+topPrompt.who+' · '+ICON.check+' 本輪代表提示</span><span>4D '+topPrompt.score+' · 得票 '+topPrompt.votes+'</span></div><div class="txt">'+topPrompt.txt+'</div>';
    log.appendChild(div);
  }
  document.getElementById('tdSolution').textContent = d.solution;
  const cov = document.getElementById('tdCoverage');
  cov.innerHTML = '';
  d.coverage.forEach(c=>{
    const row = document.createElement('div');
    row.className = 'cov-detail-row';
    row.innerHTML = '<span class="mk '+(c.ok?'ok':'no')+'">'+(c.ok?'✓':'✕')+'</span><div><div>'+c.item+'</div><div class="note">'+c.note+'</div></div>';
    cov.appendChild(row);
  });
  const hb = document.getElementById('tdHallu');
  if(d.hallucination){
    hb.style.display='block';
    hb.innerHTML = '<b>'+ICON.warning+' 幻覺紀錄：</b>「'+d.hallucination.claim+'」<br>'+d.hallucination.note;
  } else { hb.style.display='none'; }
  document.getElementById('pushTextarea').value='';
  document.getElementById('pushLog').innerHTML='';
  goto('team-detail');
}

/* ---------- send push (per-team screen) ---------- */
const cardCopy = {
  viewpoint:'試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？',
  hallu:'AI 剛剛給的數字，你要不要請它說明這個數字是怎麼算出來的？',
  blank:'目前全班還沒有人談到「執行時程與風險」，這個面向可能有分數在等你們。',
  time:'教師已為全班加時 2 分鐘，把握機會補齊還沒探索的面向。',
};
document.querySelectorAll('.push-suggest button').forEach(btn=>{
  btn.addEventListener('click', ()=>{ document.getElementById('pushTextarea').value = cardCopy[btn.dataset.tpl]; });
});
document.getElementById('sendPushBtn').addEventListener('click', ()=>{
  const txt = document.getElementById('pushTextarea').value.trim();
  if(!txt) return;
  const target = document.querySelector('input[name=pushTarget]:checked').value;
  const targetLabel = target==='all' ? '全部隊伍' : document.getElementById('tdTeamName').textContent;
  const log = document.getElementById('pushLog');
  const item = document.createElement('div');
  item.className = 'push-log-item';
  item.innerHTML = '<b>已送出 → '+targetLabel+'：</b>'+txt;
  log.prepend(item);
  const toast = document.getElementById('studentToast');
  document.getElementById('studentToastBody').textContent = txt;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toast.classList.remove('show'), 4000);
  document.getElementById('pushTextarea').value='';
});

/* ---------- pause toggle ---------- */
let isPaused = false;
document.getElementById('pauseBtn').addEventListener('click', function(){
  isPaused = !isPaused;
  document.getElementById('pauseBanner').classList.toggle('show', isPaused);
  document.getElementById('pauseIcon').innerHTML = isPaused ? ICON.play : ICON.pause;
  document.getElementById('pauseLabel').textContent = isPaused ? '恢復競賽' : '暫停競賽';
  this.style.background = isPaused ? '#5FB894' : '#E7A857';
  this.style.borderColor = isPaused ? '#5FB894' : '#E7A857';
});
document.getElementById('endArenaBtn').addEventListener('click', ()=> goto('results-teacher'));

/* ---------- add time ---------- */
document.querySelectorAll('.time-add-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const mins = parseInt(btn.dataset.min,10);
    const el = document.getElementById('statTime');
    const [mm, ss] = el.textContent.split(':').map(Number);
    const total = mm*60 + ss + mins*60;
    el.textContent = String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
    const toast = document.getElementById('studentToast');
    document.getElementById('studentToastBody').textContent = '教師已為全班加時 '+mins+' 分鐘，把握機會補齊還沒探索的面向。';
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>toast.classList.remove('show'), 4000);
  });
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

/* ---------- grading cards (per-team save/edit toggle) ---------- */
const GRADE_DATA = [
  {team:'E 隊', peerAvg:90, aiScore:89, aiNote:'覆蓋率 88%（5/6 項），數據引用皆可查核，未命中幻覺陷阱。', teacherScore:88, teacherNote:'員工溝通面處理得非常細膩，是全班唯一同時兼顧內部士氣與對外聲明的隊伍。', solution:TEAM_DETAIL['E 隊'].solution},
  {team:'A 隊', peerAvg:88, aiScore:86, aiNote:'覆蓋率 67%（4/6 項），財務數字具體可查核，未命中已知幻覺陷阱。缺少「執行時程」與「員工影響」兩個面向。', teacherScore:85, teacherNote:'財務量化清楚，方案本身也具體，但對員工端著墨較少。', solution:TEAM_DETAIL['A 隊'].solution},
  {team:'B 隊', peerAvg:82, aiScore:85, aiNote:'覆蓋率 55%，方案務實但論述較保守，缺乏具體財務試算。', teacherScore:83, teacherNote:'分階段稽核的想法穩健，建議下次補上財務面的量化。', solution:TEAM_DETAIL['B 隊'].solution},
  {team:'C 隊', peerAvg:86, aiScore:81, aiNote:'覆蓋率 22%，本回合因討論時間不足未能產出完整解方。', teacherScore:78, teacherNote:'財務量化清楚，但第 5 回合的倫理收斂稍嫌單薄，建議下次多引用具體利害關係人的觀點。', solution:TEAM_DETAIL['C 隊'].solution},
  {team:'D 隊', peerAvg:74, aiScore:63, aiNote:'覆蓋率 71%，但引用「該產業平均違規率 42%」經查核為虛構數據，已扣分。', teacherScore:65, teacherNote:'提醒團隊：引用統計數字前務必要求 AI 附上來源，這次的幻覺陷阱是本堂課的重點教訓。', solution:TEAM_DETAIL['D 隊'].solution},
];
const wrap = document.getElementById('gradeCardsWrap');
GRADE_DATA.forEach((g,idx)=>{
  const card = document.createElement('div');
  card.className='grade-card';
  card.id='grade-'+idx;
  card.innerHTML =
    '<div class="grade-top"><span class="team">'+g.team+'</span><span class="peer-avg">各組互評平均：'+g.peerAvg+' 分</span></div>'
    +'<div class="grade-solution-label">該隊最終解方</div>'
    +'<div class="solution-block">'+g.solution+'</div>'
    +'<div class="ai-eval"><span class="tag">AI 評分建議</span><div>'+g.aiNote+' 建議分數 <b>'+g.aiScore+'</b>。</div></div>'
    +'<div class="grade-inputs">'
      +'<label style="font-size:12.5px;color:var(--ink-soft);padding-top:8px;">老師分數</label><input type="number" value="'+g.teacherScore+'" id="score-'+idx+'">'
      +'<label style="font-size:12.5px;color:var(--ink-soft);padding-top:8px;">老師評語</label><textarea id="note-'+idx+'">'+g.teacherNote+'</textarea>'
    +'</div>'
    +'<div class="grade-foot"><button class="hint-btn sm" id="btn-'+idx+'">儲存並發布此隊成績</button></div>';
  wrap.appendChild(card);
});
GRADE_DATA.forEach((g,idx)=>{
  const btn = document.getElementById('btn-'+idx);
  const card = document.getElementById('grade-'+idx);
  const scoreInput = document.getElementById('score-'+idx);
  const noteInput = document.getElementById('note-'+idx);
  let graded = false;
  btn.addEventListener('click', ()=>{
    graded = !graded;
    scoreInput.disabled = graded;
    noteInput.disabled = graded;
    card.classList.toggle('graded', graded);
    btn.textContent = graded ? '修改評分' : '儲存並發布此隊成績';
  });
});
