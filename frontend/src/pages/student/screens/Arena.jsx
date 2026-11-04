import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARENA_CASES, findArenaCase, stageLabel, formatMatchTime, containsBannedWord, avatarColorFor,
  pushArenaUserMessage, resolveArenaAIReply, submitArenaAnswers, removeCandidateText,
  setCurrentSubQ, unlockNextStage, setCurrentCase, unlockNextCase,
  DEMO_HINT_TEXT, pushHint,
} from '../data.js';
import { IconSend } from '../icons.jsx';

function MessageText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
      ))}
    </>
  );
}

const LEFT_VIEWS = {
  buzz: '參賽者已送出的答案',
  info: '題目敘述與題目列表',
  hints: '教師提示',
};

// 心智圖節點位置：繞著正中間（50,50）用百分比座標算出一圈，起點在正上方、順時針分佈；
// 半徑依索引稍微錯開，不是機械式等距的正圓，看起來比較自然。
//
// 中間「基本答案」框是固定大小，但節點是沿著橢圓圈分佈，角度接近水平（左右兩側）時，x 方向的
// 半徑再怎麼加大，節點還是可能跟中間框的左右邊界重疊；角度接近垂直時換成 y 方向會卡到。所以不是
// 單純加大半徑就好，而是針對每個節點的角度，算出「只要這一軸的距離夠就不會跟中間框重疊」所需的
// 最小半徑（clearX／clearY 是中間框 + 節點本身各自一半寬高的保留量），挑兩軸裡比較容易達到
// 的那一軸套用，節點才不會被迫全部擠在很遠的同一圈，也不會跟中間框疊在一起看不清楚。
//
// 中間框／節點的「半寬半高佔畫布的百分比」以前是寫死的常數，後來候選清單欄變寬、畫布跟著變窄，
// 常數沒跟著變，節點又重疊了；這次換成固定高度的畫布變成跟著版面彈性伸縮（為了讓底下的圖例
// 不用捲動就看得到），畫布高度也會變，等於同一個問題會再發生一次，不如直接把「中間框／節點
// 實際是幾個 px 寬高」這兩個寫死的 px 常數，跟「畫布現在實際量到的寬高」一起傳進來，當場算出
// 百分比——不管畫布之後因為版面怎麼調整而變寬變窄變高變矮，都不用再回來重新校正這組常數。
const CENTER_W_PX = 160; // 中間基本答案框寬度（.stu-kmap-center 的 CSS width）
const CENTER_H_PX = 134; // 中間基本答案框高度上限（含兩行徽章文字換行的情況，留一點餘裕）
const NODE_W_PX = 112; // 單一節點卡片寬度上限（.stu-kmap-node 的 CSS max-width）
const NODE_H_PX = 72; // 單一節點卡片高度上限（文字固定只顯示 2 行＋分數那一行＋上下 padding）

function kmapNodePos(index, total, canvasW, canvasH) {
  const centerHalfWPct = (CENTER_W_PX / 2 / canvasW) * 100;
  const centerHalfHPct = (CENTER_H_PX / 2 / canvasH) * 100;
  const nodeHalfWPct = (NODE_W_PX / 2 / canvasW) * 100;
  const nodeHalfHPct = (NODE_H_PX / 2 / canvasH) * 100;
  const clearX = centerHalfWPct + nodeHalfWPct;
  const clearY = centerHalfHPct + nodeHalfHPct;
  const outerMaxRx = 50 - nodeHalfWPct; // 節點不能超出畫布左右邊界的半徑上限
  const outerMaxRy = 50 - nodeHalfHPct; // 節點不能超出畫布上下邊界的半徑上限

  const angle = ((360 / total) * index - 90) * (Math.PI / 180);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const reqRx = (clearX / Math.max(Math.abs(cosA), 0.12)) * 1.08;
  const reqRy = (clearY / Math.max(Math.abs(sinA), 0.12)) * 1.08;
  const rxViable = reqRx <= outerMaxRx;
  const ryViable = reqRy <= outerMaxRy;
  let rx = 20 + (index % 3) * 4;
  let ry = 20 + (index % 2) * 5;
  // 兩軸都量過之後，只挑「真的在畫布範圍內還閃得開」的那一軸來套用，單純比較數字大小、
  // 不管有沒有超出畫布邊界的話，角度接近對角線時兩軸都會被夾到超出邊界，反而還是會疊到。
  if (rxViable && (!ryViable || reqRx <= reqRy)) {
    rx = Math.max(rx, reqRx);
  } else if (ryViable) {
    ry = Math.max(ry, reqRy);
  } else if (reqRx <= reqRy) {
    rx = outerMaxRx;
  } else {
    ry = outerMaxRy;
  }
  rx = Math.min(rx, outerMaxRx);
  ry = Math.min(ry, outerMaxRy);
  return { x: 50 + rx * cosA, y: 50 + ry * sinA };
}

export default function Arena({ arenaState, onUpdate, onEndCompetition, onReplayHint, showToast }) {
  const [leftView, setLeftView] = useState('buzz');
  const [input, setInput] = useState('');
  const [aiPending, setAiPending] = useState(false);
  const [checked, setChecked] = useState({});
  const [manualInput, setManualInput] = useState('');
  const [kmapZoom, setKmapZoom] = useState(1);
  const [kmapPan, setKmapPan] = useState({ x: 0, y: 0 });
  // 心智圖畫布實際量到的寬高（CSS px，不受 --ui-zoom 那層縮放影響，因為量的是
  // clientWidth/clientHeight，不是 getBoundingClientRect——後者才會被祖先的 transform:scale
  // 影響）。畫布高度現在是用 flex 撐出來的（讓底下的圖例不用捲動），不是寫死的 px，所以不能再
  // 用寫死的百分比常數算節點位置，要用這組即時量到的尺寸現場算。
  const [kmapCanvasSize, setKmapCanvasSize] = useState({ width: 460, height: 370 });
  const textareaRef = useRef(null);
  const manualInputRef = useRef(null);
  const threadRef = useRef(null);
  const kmapDragRef = useRef(null);
  // 記「使用者上一次點進去打字的是哪一個輸入框」（AI 對話框還是中欄手動輸入），不是用 state
  // （不需要為了這個觸發重新渲染，純粹給下面的全域鍵盤監聽查）。使用者點擊畫面空白處時會被
  // 清成 null，打字才不會搶焦點——只有「上一個用過的輸入框」還算數時才自動幫使用者把焦點
  // 接回去，不是不管使用者在幹嘛都霸王硬上弓搶焦點。
  const lastActiveInputRef = useRef(null);
  const state = arenaState;
  const caseId = state.currentCaseId;
  const caseIndex = ARENA_CASES.findIndex((c) => c.id === caseId);
  const caseDef = findArenaCase(caseId);
  const caseState = state.cases[caseId];
  const subqId = caseState.currentSubQ;
  const stage = caseState.stages[subqId];
  const stageCount = caseDef.stages.length;
  const basicList = caseDef.stages[subqId - 1].basicAnswers;
  const buzzList = caseState.publicBuzz[subqId];

  // 只有「目前教師開放到的那一題」＋「目前教師開放到的那個階段」才能繼續對話／送出答案；
  // 競賽暫停、或正在看過去已經做完的題目／階段，都只能檢視，不能再互動
  const caseIsLive = caseIndex === state.unlockedCaseIndex;
  const stageIsLive = subqId === caseState.unlockedSubQ;
  let lockReason = null;
  if (state.isArenaPaused) lockReason = '⏸ 競賽已暫停，恢復後才能繼續對話與送出答案。';
  else if (!caseIsLive) lockReason = '這一題不是目前進行中的題目，僅供查看，不能再對話或送出答案。';
  else if (!stageIsLive) lockReason = '這個階段已經不是目前最新開放的階段，僅供查看，不能再對話或送出答案。';
  const interactive = !lockReason;

  // 切換案例／階段或這個階段有新訊息時，自動捲到對話最底部
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [caseId, subqId, stage.messages.length]);

  // 換題目／換階段時心智圖的縮放跟平移重置，不要延續上一題的視角——不然切題目後畫面
  // 可能還停留在上一題放大／拖到旁邊的位置，看起來像是當前題目的地圖是空的或跑版。
  useEffect(() => {
    setKmapZoom(1);
    setKmapPan({ x: 0, y: 0 });
  }, [caseId, subqId]);

  // 「打字就直接進上一個用過的輸入框」：使用者不用每次都重新點一次輸入框才能打字，只有第一次
  // 用某個輸入框（或點了畫面空白處把 lastActiveInputRef 清掉之後）才需要真的點一下。在 window
  // 上掛鍵盤事件、不是掛在單一元素上——這樣不管目前焦點在頁面的哪裡（甚至沒有任何東西被選取），
  // 只要按下的是看起來像打字的鍵，都攔得到。偵測到的時候呼叫 focus() 是同步的，瀏覽器接著處理
  // 這個按鍵本身的預設動作（真正把字元打進輸入框）時，焦點已經換好了，字元會進到新焦點的輸入框
  // 裡，不會憑空消失也不會進錯地方。
  useEffect(() => {
    function handleGlobalKeydown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // 快捷鍵（複製貼上、瀏覽器快捷鍵等）不要攔
      if (e.key.length !== 1) return; // 只接可見字元，Enter／Backspace／方向鍵這些控制鍵不處理
      const active = document.activeElement;
      const isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isEditable) return; // 已經有輸入框被選取（不管是不是這兩個），不要搶走使用者現在的焦點
      const target = lastActiveInputRef.current === 'chat' ? textareaRef.current
        : lastActiveInputRef.current === 'manual' ? manualInputRef.current
        : null;
      if (target && !target.disabled) target.focus();
    }
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  // 點到畫面空白處（沒點中任何輸入框／按鈕／連結／勾選框等互動元件）就把「上一個用過的輸入框」
  // 記錄清掉，使用者故意點開別的地方時，接下來打字才不會又被搶去塞進輸入框裡。
  function handleArenaBackgroundClick(e) {
    if (!e.target.closest('input, textarea, button, a, label, select, svg, [role="tab"]')) {
      lastActiveInputRef.current = null;
    }
  }

  function gotoCase(id, idx) {
    if (idx > state.unlockedCaseIndex) return; // 鎖住的題目點了沒反應
    if (id === caseId) return;
    onUpdate((s) => setCurrentCase(s, id));
  }

  function gotoStage(n) {
    if (n > caseState.unlockedSubQ) return; // 鎖住的階段點了沒反應
    onUpdate((s) => setCurrentSubQ(s, caseId, n));
  }

  function sendPrompt() {
    if (!interactive || aiPending) return;
    const val = input.trim();
    if (!val) return;
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    const pendingIndex = stage.messages.length + 1;
    const isFirst = stage.messages.length === 0;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '';
    setAiPending(true);
    onUpdate((s) => pushArenaUserMessage(s, caseId, subqId, val));
    setTimeout(() => {
      onUpdate((s) => resolveArenaAIReply(s, caseId, subqId, pendingIndex, isFirst));
      setAiPending(false);
    }, 700);
    // 不管這次送出是按 Enter 還是點擊畫面上的送出按鈕（點擊按鈕會把焦點搶過去，按鈕送出後
    // 通常也會變成 disabled，瀏覽器就把焦點整個移開到 body），送出完都主動把焦點移回輸入框，
    // 不是被動等下一次按鍵才去偵測轉送（原因見下方 handleSubmitAll 同樣位置的說明：那套全域
    // 鍵盤監聽對輸入法合成中的按鍵不一定接得到）。
    textareaRef.current?.focus();
  }

  // 候選清單：AI 在這個階段所有回覆的列點，加上使用者自己打字加進來的想法，去掉重複（同一句
  // 文字只留一筆）；已經送出過的（不管結果是命中基本答案、搶答成功還是重複不計分）標成
  // submitted，畫面上用灰階＋停用勾選框呈現，但不會整筆從清單上消失。
  function candKey(text) {
    return `${caseId}|${subqId}|${text}`;
  }
  const candidateList = (() => {
    const seen = new Set();
    const list = [];
    const pushCandidate = (text) => {
      if (seen.has(text)) return;
      seen.add(text);
      list.push({ text, submitted: stage.submittedTexts.includes(text) });
    };
    stage.messages.forEach((m) => { if (m.role === 'ai' && !m.pending) m.points.forEach(pushCandidate); });
    stage.manualCandidates.forEach(pushCandidate);
    return list;
  })();

  function toggleCandidate(text) {
    const key = candKey(text);
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // 全選：已經送出過的項目本來就不能再勾，不算在「可選」範圍內，勾選框打勾／打叉、點下去要
  // 全部選或全部取消，都只看這些還沒送出的項目，不會動到已經停用的那些。someSelected 用來
  // 讓全選框顯示「部分選取」的三態樣式（勾一半的樣子），不是只有全勾／全不勾兩態。
  const selectableCandidates = candidateList.filter((c) => !c.submitted);
  const allSelected = selectableCandidates.length > 0 && selectableCandidates.every((c) => checked[candKey(c.text)]);
  const someSelected = selectableCandidates.some((c) => checked[candKey(c.text)]);
  function handleToggleSelectAll() {
    if (!interactive || selectableCandidates.length === 0) return;
    const next = !allSelected;
    setChecked((prev) => {
      const updated = { ...prev };
      selectableCandidates.forEach((c) => { updated[candKey(c.text)] = next; });
      return updated;
    });
  }

  // 刪掉候選清單裡一項還沒送出的內容：候選清單是從 AI 回覆訊息的 points 陣列即時彙整出來的，
  // 不是獨立的一份清單，所以刪除要透過 removeCandidateText 回頭去源頭拿掉，光改本地畫面狀態
  // 的話下次重新渲染又會從訊息裡重新長出來。已經送出過的項目不給刪（刪了也不會真的影響已經
  // 算完的分數，留著只會讓使用者誤以為刪除等於取消送出，乾脆直接不給刪，跟勾選框停用邏輯一致）。
  function handleDeleteCandidate(text) {
    if (!interactive) return;
    onUpdate((s) => removeCandidateText(s, caseId, subqId, text));
    setChecked((prev) => {
      const next = { ...prev };
      delete next[candKey(text)];
      return next;
    });
  }

  const selectedTexts = candidateList.filter((c) => !c.submitted && checked[candKey(c.text)]).map((c) => c.text);

  // 中欄手動輸入框目前打的字（還沒送出的），trim 過；拿去跟已勾選的 AI 列點候選項目合併送出。
  const pendingManualText = manualInput.trim();
  const submitCount = selectedTexts.length + (pendingManualText ? 1 : 0);

  // 「送出答案」按鈕跟手動輸入框按 Enter 共用同一套送出邏輯：把目前勾選的 AI 列點候選項目，
  // 加上手動輸入框裡還沒送出的文字（如果有打字的話）一次送出，不是兩條分開、互不相干的路徑
  // ——使用者打完字除了按 Enter，直覺上也會想直接按畫面上的「送出答案」鈕送出，這兩種操作要有
  // 一樣的效果，不能「送出答案」鈕只認勾選框、不認輸入框裡打的字（打了字那顆鈕還是不會亮）。
  // 先用目前的 state 算出要跳什麼提示，再透過 onUpdate 用 React 給的最新 s 實際套用——避免
  // 連續快速點擊時用到過期的 state。
  function handleSubmitAll() {
    if (!interactive) return;
    if (pendingManualText && containsBannedWord(pendingManualText)) {
      showToast('內容包含不適當字詞，請修改後再送出。');
      return;
    }
    const texts = pendingManualText ? [...selectedTexts, pendingManualText] : selectedTexts;
    if (texts.length === 0) return;
    const { summary } = submitArenaAnswers(state, caseId, subqId, texts);
    onUpdate((s) => submitArenaAnswers(s, caseId, subqId, texts).state);
    setChecked((prev) => {
      const next = { ...prev };
      selectedTexts.forEach((text) => { delete next[candKey(text)]; });
      return next;
    });
    if (pendingManualText) setManualInput('');
    const parts = [];
    if (summary.basicCount > 0) parts.push(`命中基本答案 ${summary.basicCount} 格（+${summary.basicScore} 分）`);
    if (summary.publicCount > 0) parts.push(`搶答成功 ${summary.publicCount} 項（+${summary.publicScore} 分）`);
    if (summary.dupCount > 0) parts.push(`重複不計分 ${summary.dupCount} 項`);
    showToast(`送出 ${texts.length} 項：${parts.join('、')}`);
    // 不管這次送出是按 Enter（輸入框本來就還focus著）還是點「送出答案」鈕（點擊會把焦點搶去
    // 按鈕上，送出完按鈕通常也會變成 disabled，瀏覽器就把焦點整個移開到 body）觸發的，送出完
    // 都主動把焦點移回輸入框——不是被動等下一次按鍵時才去偵測、轉送焦點（那套全域鍵盤監聽對
    // 中文注音／拼音輸入法不一定可靠：輸入法合成中的按鍵，瀏覽器收到的 keydown.key 常常是
    // "Process" 這種特殊值，不是真的那個字元，會被原本的判斷式過濾掉，導致合成期間的按鍵
    // 沒辦法觸發自動轉焦點）。主動呼叫 focus() 不管送出方式是什麼、也不管接下來要打的是英文
    // 還是中文輸入法，都能直接把焦點準備好。
    manualInputRef.current?.focus();
  }

  // 心智圖像地圖一樣可以縮放／拖曳平移：縮放用 wheel 滾輪（也給 +/- 按鈕，滑鼠沒有滾輪或在
  // 觸控裝置上也能用），平移用拖曳（pointer event，滑鼠／觸控都支援）。拖曳只記「這次拖曳的
  // 起點座標＋拖曳開始當下的 pan 值」（kmapDragRef），移動時用目前座標減起點算差值加回去，
  // 不是每次 move 都疊加（那樣會累積誤差，滑鼠移動速度一快還會飄移）。
  const KMAP_ZOOM_MIN = 0.6;
  const KMAP_ZOOM_MAX = 2.5;
  function kmapZoomBy(delta) {
    setKmapZoom((z) => Math.min(KMAP_ZOOM_MAX, Math.max(KMAP_ZOOM_MIN, +(z + delta).toFixed(2))));
  }
  // React 的 onWheel 是掛被動（passive）監聽器，裡面呼叫 preventDefault() 會被瀏覽器忽略還
  // 噴 console 警告（滾輪事件此時還是會讓頁面跟著捲動）。改用 callback ref 自己掛原生事件、
  // 手動指定 { passive: false }，滾輪滾動心智圖時才不會同時捲動到外層頁面。callback ref 在
  // 「全班的答案」切換視圖離開／回來時會整個卸載重掛（條件渲染），所以掛跟卸載監聽器都要在
  // 這支 callback 裡自己做，不能只掛一次。
  const kmapCanvasCleanupRef = useRef(null);
  const attachKmapCanvas = useCallback((node) => {
    if (kmapCanvasCleanupRef.current) {
      kmapCanvasCleanupRef.current();
      kmapCanvasCleanupRef.current = null;
    }
    if (node) {
      const onWheel = (e) => {
        e.preventDefault();
        setKmapZoom((z) => Math.min(KMAP_ZOOM_MAX, Math.max(KMAP_ZOOM_MIN, z - e.deltaY * 0.0015)));
      };
      node.addEventListener('wheel', onWheel, { passive: false });
      setKmapCanvasSize({ width: node.clientWidth, height: node.clientHeight });
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setKmapCanvasSize({ width, height });
      });
      observer.observe(node);
      kmapCanvasCleanupRef.current = () => {
        node.removeEventListener('wheel', onWheel);
        observer.disconnect();
      };
    }
  }, []);
  function handleKmapPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    kmapDragRef.current = { startX: e.clientX, startY: e.clientY, originX: kmapPan.x, originY: kmapPan.y };
  }
  function handleKmapPointerMove(e) {
    const drag = kmapDragRef.current;
    if (!drag) return;
    setKmapPan({ x: drag.originX + (e.clientX - drag.startX), y: drag.originY + (e.clientY - drag.startY) });
  }
  function handleKmapPointerUp(e) {
    kmapDragRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function kmapResetView() {
    setKmapZoom(1);
    setKmapPan({ x: 0, y: 0 });
  }

  function handlePauseToggle() {
    const next = !state.isArenaPaused;
    showToast(next ? '競賽已暫停' : '競賽已恢復');
    onUpdate((s) => ({ ...s, isArenaPaused: next }));
  }

  function handleExtend() {
    onUpdate((s) => ({ ...s, matchSecondsLeft: s.matchSecondsLeft + 120 }));
    showToast('教師已為全班加時');
  }

  function handleUnlockNextStage() {
    if (caseState.unlockedSubQ >= stageCount) return;
    onUpdate((s) => unlockNextStage(s, caseId));
    showToast(`教師已開放階段${stageLabel(caseState.unlockedSubQ + 1)}`);
  }

  function handleUnlockNextCase() {
    if (state.unlockedCaseIndex >= ARENA_CASES.length - 1) return;
    onUpdate((s) => unlockNextCase(s));
    showToast(`教師已開放下一題：${ARENA_CASES[state.unlockedCaseIndex + 1].tag}`);
  }

  function handlePushHint() {
    onUpdate((s) => pushHint(s, DEMO_HINT_TEXT));
    onReplayHint(); // 畫面右下角的「來自教師」提示條，看過之後內容仍留在「教師提示」切換視圖裡
  }

  // 示範「答對一格基本答案」的效果：直接拿這個階段還沒亮起來的基本答案原文送出（跟真的使用者
  // 自己打字送出走同一套 submitArenaAnswers，不是另外寫一條假的「亮格子」邏輯），文字送進去
  // 一定會命中（textSimilarity 對完全一樣的文字算 1），示範效果才會跟真正命中時完全一樣：
  // 基本答案板那一格從 ? 變亮、心智圖中間框更新、加 2 分、跳 toast。
  const nextBasicIndex = basicList.findIndex((_, i) => !stage.revealed.includes(i));
  function handleDemoFillBasicAnswer() {
    if (!interactive || nextBasicIndex === -1) return;
    const text = basicList[nextBasicIndex];
    const { summary } = submitArenaAnswers(state, caseId, subqId, [text]);
    onUpdate((s) => submitArenaAnswers(s, caseId, subqId, [text]).state);
    showToast(`（Demo）示範命中基本答案：${text}（+${summary.basicScore} 分）`);
  }

  return (
    <div className="stu-arena-main" onClick={handleArenaBackgroundClick}>
      <div className="stu-arena-status-row">
        <div className="stu-status-left">
          <span className="stu-status-dot" />
          <span className="stu-status-team">{state.myTeam}</span>
          <div className="stu-status-dots" title={`已答出 ${stage.revealed.length} / ${basicList.length} 格基本答案`}>
            {basicList.map((_, i) => (
              <span className={`stu-status-circle${stage.revealed.includes(i) ? ' stu-status-circle-filled' : ''}`} key={i} />
            ))}
          </div>
          <span className="stu-status-score">{state.myScore} 分</span>
        </div>
        <div className="stu-timer-wrap">
          <div className="stu-timer">{formatMatchTime(state.matchSecondsLeft)}</div>
          <div className="stu-timer-label">全場剩餘時間</div>
        </div>
      </div>

      {state.isArenaPaused && (
        <div className="stu-pause-banner">⏸ 競賽已暫停，倒數已凍結，請等待教師恢復。</div>
      )}

      <div className="stu-arena-layout-v2">
        <div className="panel stu-knowledge-panel">
          <div className="stu-lpanel-toggle" role="tablist">
            <button type="button" role="tab" aria-selected={leftView === 'buzz'} className={`stu-lpanel-toggle-btn${leftView === 'buzz' ? ' stu-lpanel-toggle-btn-on' : ''}`} onClick={() => setLeftView('buzz')}>全班的答案</button>
            <button type="button" role="tab" aria-selected={leftView === 'info'} className={`stu-lpanel-toggle-btn${leftView === 'info' ? ' stu-lpanel-toggle-btn-on' : ''}`} onClick={() => setLeftView('info')}>題目敘述＆題目列表</button>
            <button type="button" role="tab" aria-selected={leftView === 'hints'} className={`stu-lpanel-toggle-btn${leftView === 'hints' ? ' stu-lpanel-toggle-btn-on' : ''}`} onClick={() => setLeftView('hints')}>教師提示</button>
          </div>
          <div className="eyebrow" style={{ marginTop: 12 }}>{LEFT_VIEWS[leftView]}</div>

          {leftView === 'buzz' && (
            <div className="stu-kmap-view">
              <div
                className="stu-kmap-canvas"
                ref={attachKmapCanvas}
                onPointerDown={handleKmapPointerDown}
                onPointerMove={handleKmapPointerMove}
                onPointerUp={handleKmapPointerUp}
                onPointerLeave={handleKmapPointerUp}
                onDoubleClick={kmapResetView}
              >
                <div className="stu-kmap-zoom-controls" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                  <button type="button" className="stu-kmap-zoom-btn" aria-label="放大" onClick={() => kmapZoomBy(0.2)}>＋</button>
                  <button type="button" className="stu-kmap-zoom-btn" aria-label="縮小" onClick={() => kmapZoomBy(-0.2)}>－</button>
                  <button type="button" className="stu-kmap-zoom-btn stu-kmap-zoom-btn-reset" aria-label="重置視角" onClick={kmapResetView}>⟲</button>
                </div>

                <div
                  className="stu-kmap-zoom-layer"
                  style={{ transform: `translate(${kmapPan.x}px, ${kmapPan.y}px) scale(${kmapZoom})` }}
                >
                  <svg className="stu-kmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {buzzList.map((entry, i) => {
                      const pos = kmapNodePos(i, buzzList.length, kmapCanvasSize.width, kmapCanvasSize.height);
                      return (
                        <line
                          key={i}
                          x1="50" y1="50" x2={pos.x} y2={pos.y}
                          stroke={avatarColorFor(entry.team)} strokeWidth=".4"
                          strokeDasharray={i % 4 === 0 ? '2 1.4' : undefined}
                        />
                      );
                    })}
                  </svg>

                  <div className="stu-kmap-center">
                    <div className="stu-lpanel-subhead" style={{ marginBottom: 6 }}>基本答案<span className="stu-live-badge">只有自己隊看得到進度</span></div>
                    <div className="stu-basic-chip-row">
                      {basicList.map((answer, i) => {
                        const revealed = stage.revealed.includes(i);
                        return (
                          <span className={`stu-basic-chip${revealed ? ' stu-basic-chip-revealed' : ''}`} key={i}>
                            {i + 1}
                            {revealed && <span className="stu-basic-chip-tip">{answer}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {buzzList.map((entry, i) => {
                    const pos = kmapNodePos(i, buzzList.length, kmapCanvasSize.width, kmapCanvasSize.height);
                    return (
                      <div className="stu-kmap-node-wrap" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} key={i}>
                        <div className="stu-kmap-node" style={{ background: avatarColorFor(entry.team) }} title={entry.text}>
                          <span className="stu-kmap-node-text">{entry.text}</span>
                          <span className="stu-kmap-node-score">+{entry.score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {buzzList.length === 0 ? (
                <div className="stu-observed-empty">還沒有人搶答，搶第一個！</div>
              ) : (
                <div className="stu-kmap-footer">
                  <span className="stu-slido-count">{buzzList.length} 個答案</span>
                  <div className="stu-slido-legend">
                    {[...new Set(buzzList.map((e) => e.team))].map((team) => (
                      <span className="stu-slido-legend-item" key={team}>
                        <span className="stu-slido-legend-dot" style={{ background: avatarColorFor(team) }} />{team}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {leftView === 'info' && (
            <div className="stu-lpanel-scroll">
              {caseDef.brief.map((p, i) => <p className="stu-info-brief" key={i}>{p}</p>)}
              <div className="stu-lpanel-subhead" style={{ margin: "14px 0 8px" }}>這一題的階段</div>
              <div className="stu-info-list">
                {caseDef.stages.map((s, i) => {
                  const n = i + 1;
                  const locked = n > caseState.unlockedSubQ;
                  const dim = n !== caseState.unlockedSubQ;
                  if (locked) {
                    return <div className="stu-case-item stu-case-item-locked" title="教師還沒開放這個階段" key={n}>階段{stageLabel(n)} 🔒</div>;
                  }
                  return (
                    <button
                      type="button"
                      key={n}
                      className={`stu-case-item${subqId === n ? ' stu-case-item-active' : ''}${dim ? ' stu-case-item-dim' : ''}`}
                      onClick={() => gotoStage(n)}
                    >
                      階段{stageLabel(n)}：{s.title}
                    </button>
                  );
                })}
              </div>
              <div className="stu-lpanel-subhead" style={{ margin: "14px 0 8px" }}>題目列表</div>
              <div className="stu-info-list">
                {ARENA_CASES.map((c, i) => {
                  const locked = i > state.unlockedCaseIndex;
                  const dim = i !== state.unlockedCaseIndex;
                  if (locked) {
                    return <div className="stu-case-item stu-case-item-locked" title="教師還沒開放這一題" key={c.id}>題目 {i + 1} 🔒</div>;
                  }
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className={`stu-case-item${c.id === caseId ? ' stu-case-item-active' : ''}${dim ? ' stu-case-item-dim' : ''}`}
                      onClick={() => gotoCase(c.id, i)}
                    >
                      {c.tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {leftView === 'hints' && (
            <div className="stu-lpanel-scroll">
              {state.hints.length === 0 ? (
                <div className="stu-observed-empty">目前還沒有教師提示。</div>
              ) : (
                <div className="stu-hint-list">
                  {state.hints.slice().reverse().map((h, i) => (
                    <div className="stu-hint-item" key={i}>{h.text}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="panel stu-candidates-panel">
          <div className="eyebrow">AI 列點答案統整<span className="stu-live-badge">勾選想送出的答案</span></div>
          <div className="stu-lpanel-scroll stu-candidates-scroll">
            {candidateList.length === 0 ? (
              <div className="stu-observed-empty">先跟右邊的 AI 討論，AI 回覆的列點會自動整理到這裡。</div>
            ) : (
              candidateList.map((c, i) => (
                <div className={`stu-candidate-row${c.submitted ? ' stu-candidate-row-disabled' : ''}`} key={i}>
                  <label className="stu-candidate-row-main">
                    <input
                      type="checkbox"
                      checked={!!checked[candKey(c.text)]}
                      disabled={c.submitted || !interactive}
                      onChange={() => toggleCandidate(c.text)}
                    />
                    <span className="stu-candidate-text">
                      <MessageText text={c.text} />
                      {c.submitted && <span className="stu-candidate-note">地圖上已存在</span>}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="stu-candidate-delete-btn"
                    aria-label="刪除這個答案"
                    title="刪除這個答案"
                    disabled={c.submitted || !interactive}
                    onClick={() => handleDeleteCandidate(c.text)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          {candidateList.length > 0 && (
            <label className="stu-candidate-select-all">
              <input
                type="checkbox"
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                checked={allSelected}
                disabled={!interactive || selectableCandidates.length === 0}
                onChange={handleToggleSelectAll}
              />
              全選
            </label>
          )}
          <div className="stu-candidate-manual-row">
            <input
              ref={manualInputRef}
              type="text"
              placeholder="自己打字提出想法，按 Enter 直接送出…"
              value={manualInput}
              disabled={!interactive}
              onFocus={() => { lastActiveInputRef.current = 'manual'; }}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitAll(); }}
            />
          </div>
          <button type="button" className="stu-candidate-submit-btn" disabled={!interactive || submitCount === 0} onClick={handleSubmitAll}>
            送出答案{submitCount > 0 ? `（共 ${submitCount} 項）` : ''}
          </button>
        </div>

        <div className="panel stu-chat-panel stu-arena-chat-panel">
          <div className="eyebrow">與 AI 對話 · 階段{stageLabel(subqId)}：{caseDef.stages[subqId - 1].title}</div>
          <div className="stu-chat-conv">
            <div className="stu-chat-thread" ref={threadRef}>
              {stage.messages.length === 0 ? (
                <div className="stu-chat-empty">
                  {interactive ? '送出第一則訊息，開始跟 AI 討論這個階段吧。' : '這裡還沒有任何對話紀錄。'}
                </div>
              ) : (
                stage.messages.map((m, mi) => (
                  <div className={`stu-bubble stu-bubble-${m.role}${m.pending ? ' stu-bubble-pending' : ''}`} key={mi}>
                    {m.role === 'ai' && !m.pending ? (
                      m.points.map((p, pi) => (
                        <div className="stu-point-row stu-point-row-readonly" key={pi}>
                          <span className="stu-point-text">・<MessageText text={p} /></span>
                        </div>
                      ))
                    ) : (
                      <MessageText text={m.text} />
                    )}
                  </div>
                ))
              )}
            </div>

            {interactive ? (
              <div className="stu-composer">
                <textarea
                  ref={textareaRef}
                  placeholder="跟 AI 討論這個階段的想法……"
                  rows={1}
                  value={input}
                  onFocus={() => { lastActiveInputRef.current = 'chat'; }}
                  onChange={(e) => {
                    setInput(e.target.value);
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPrompt(); }
                  }}
                />
                <button type="button" className="stu-send-btn" aria-label="送出" title="送出" disabled={aiPending || !input.trim()} onClick={sendPrompt}>
                  <IconSend />
                </button>
              </div>
            ) : (
              <div className="stu-chat-readonly-note">🔒 {lockReason}</div>
            )}
          </div>
        </div>
      </div>

      <div className="stu-arena-demo-row">
        <button
          type="button"
          className="stu-btn stu-btn-ghost stu-btn-sm"
          disabled={!interactive || nextBasicIndex === -1}
          onClick={handleDemoFillBasicAnswer}
        >
          （Demo）示範答對一格基本答案
        </button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePushHint}>（Demo）教師推播提示</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handlePauseToggle}>{state.isArenaPaused ? '（Demo）教師恢復競賽' : '（Demo）教師暫停競賽'}</button>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleExtend}>（Demo）教師加時 +2 分鐘</button>
        {caseState.unlockedSubQ < stageCount && (
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleUnlockNextStage}>（Demo）教師開放下一階段</button>
        )}
        {state.unlockedCaseIndex < ARENA_CASES.length - 1 && (
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleUnlockNextCase}>（Demo）教師開放下一題</button>
        )}
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onEndCompetition}>（Demo）結束本場競賽 → 查看結果</button>
      </div>
    </div>
  );
}
