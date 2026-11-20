import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARENA_CASE, STAGE_COUNT, stageName, formatMatchTime, containsBannedWord, avatarColorFor,
  pushArenaUserMessage, resolveArenaAIReply, submitArenaAnswers, removeCandidateText,
  setCurrentSubQ, unlockNextStage,
  DEMO_HINT_TEXT, pushHint, clusterPublicBuzz,
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

// 計時長條上的太空人：面向右邊、手上拿旗子；旗子顏色跟著長條狀態（currentColor）
function AstronautIcon() {
  return (
    <svg className="stu-timebar-astro-svg" viewBox="0 0 28 32" aria-hidden="true">
      <line x1="21" y1="3" x2="21" y2="23" stroke="#C9CEDD" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M21 3 L28 6 L21 9 Z" fill="currentColor" />
      <rect x="4" y="12" width="5" height="9" rx="1.5" fill="#B9BFD3" />
      <rect x="8" y="21" width="4" height="8" rx="2" fill="#E2E5F0" />
      <rect x="13" y="21" width="4" height="8" rx="2" fill="#E2E5F0" />
      <rect x="7" y="12" width="11" height="11" rx="4" fill="#F0F0FF" />
      <path d="M15 16 L21 15" stroke="#F0F0FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12.5" cy="8" r="6.5" fill="#F0F0FF" />
      <ellipse cx="14" cy="8" rx="4" ry="3.2" fill="#0D0D15" />
      <ellipse cx="15.3" cy="7" rx="1.3" ry="0.9" fill="currentColor" />
    </svg>
  );
}

// 計時長條的終點
function MoonIcon() {
  return (
    <svg className="stu-timebar-moon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#E6E8F2" />
      <circle cx="11" cy="12" r="3" fill="#C3C7D6" />
      <circle cx="20" cy="20" r="4" fill="#C3C7D6" />
      <circle cx="20" cy="9" r="2" fill="#C3C7D6" />
      <circle cx="9" cy="21" r="1.6" fill="#C3C7D6" />
    </svg>
  );
}

// 狀態列和基本答案格共用的星星形狀
const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

const LEFT_PANEL_TABS = {
  buzz: '全班的答案',
  info: '題目敘述',
  hints: '教師提示',
};

const LEFT_VIEWS = {
  buzz: '參賽者已送出的答案',
  info: '題目敘述與階段',
  hints: '教師提示',
};

// 「全班的答案」版面（仿 Slido）：中間是基本答案框，四周是意思相近的答案併成的方框。
// 做法是先在 JS 裡算好每個方框的大小，再一個一個找不會重疊的位置放上去：
// 1. 大小：每行最多 10 個字（自己切行，不交給瀏覽器自動換行，才算得出準確的寬高）；
//    越多隊答到同一個意思，字越大，方框跟著變大。
// 2. 位置：從中心往外繞（每個方框的起始角度用黃金角錯開，才不會都擠在同一側），
//    半徑由小到大、角度左右輪流試，第一個「不壓到中間框、也不壓到已放好的方框」的位置就放。
//    橫向拉長成橢圓，因為抽屜是寬的。
// 3. 全部放好後量整體外框，畫布放不下就整體等比例縮小（之後還是可以手動放大、拖曳）。
// 座標都是 px、以畫布正中央為 (0,0)。
const KMAP_LINE_CHARS = 10;
const KMAP_CENTER = { w: 160, h: 126 }; // 中間基本答案框（.stu-kmap-center 的寬高）
const KMAP_GAP = 16; // 方框之間至少留的距離
const KMAP_TAG_H = 22; // 方框上方隊伍標籤那一列的高度
const KMAP_TAG_W = 52; // 一個隊伍標籤大約的寬度

// 英數字大約只有中文字一半寬
function kmapTextUnits(line) {
  return Array.from(line).reduce((sum, ch) => sum + (/[\x20-\x7e]/.test(ch) ? 0.58 : 1), 0);
}

// 切行：一行最多 10 個中文字寬。中文一個字一個字放；英文整個單字一起放，放不下就換行，
// 單字本身比一行還長才從中間切開
function splitKmapLines(text) {
  const tokens = text.trim().match(/[\x21-\x7e]+\s*|\s+|[^\x00-\x7f]/g) || [];
  const lines = [];
  let line = '';
  tokens.forEach((token) => {
    if (kmapTextUnits((line + token).trimEnd()) <= KMAP_LINE_CHARS) { line += token; return; }
    if (line.trim()) lines.push(line.trimEnd());
    line = '';
    let rest = token.trimStart();
    while (kmapTextUnits(rest.trimEnd()) > KMAP_LINE_CHARS) {
      let cut = '';
      for (const ch of rest) { if (kmapTextUnits(cut + ch) > KMAP_LINE_CHARS) break; cut += ch; }
      lines.push(cut);
      rest = rest.slice(cut.length);
    }
    line = rest;
  });
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function rectsOverlap(a, b, gap) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

function layoutKmap(clusters) {
  const centerRect = { x: -KMAP_CENTER.w / 2, y: -KMAP_CENTER.h / 2, w: KMAP_CENTER.w, h: KMAP_CENTER.h };
  const placed = [];
  const nodes = clusters.map((cluster, index) => {
    const fontSize = Math.min(14 + (cluster.teams.length - 1) * 4, 26);
    const lines = splitKmapLines(cluster.text);
    const padX = Math.round(fontSize * 0.8);
    const padY = Math.round(fontSize * 0.6);
    const boxW = Math.ceil(Math.max(...lines.map(kmapTextUnits)) * fontSize) + padX * 2 + 4;
    const boxH = Math.ceil(lines.length * fontSize * 1.4) + padY * 2 + 4;
    const w = Math.max(boxW, cluster.teams.length * KMAP_TAG_W);
    const h = boxH + KMAP_TAG_H;
    const baseAngle = (index * 137.5 - 90) * (Math.PI / 180);
    let spot = null;
    for (let r = 60; r < 2000 && !spot; r += 10) {
      for (let k = 0; k < 24 && !spot; k += 1) {
        const offset = (k % 2 === 0 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 12);
        const cx = Math.cos(baseAngle + offset) * r * 1.6;
        const cy = Math.sin(baseAngle + offset) * r;
        // 方框中心在 (cx, cy)，標籤在方框上面，所以整塊的上緣要再往上 KMAP_TAG_H
        const rect = { x: cx - w / 2, y: cy - boxH / 2 - KMAP_TAG_H, w, h };
        if (!rectsOverlap(rect, centerRect, KMAP_GAP + 6) && placed.every((p) => !rectsOverlap(rect, p, KMAP_GAP))) {
          spot = { cx, cy, rect };
        }
      }
    }
    placed.push(spot.rect);
    return { cluster, fontSize, lines, padX, padY, boxW, x: spot.cx, y: spot.cy };
  });
  // 以正中央為準量左右、上下最遠到哪裡（對稱），縮放時中間框才會維持在正中間
  let halfW = KMAP_CENTER.w / 2;
  let halfH = KMAP_CENTER.h / 2;
  placed.forEach((r) => {
    halfW = Math.max(halfW, Math.abs(r.x), Math.abs(r.x + r.w));
    halfH = Math.max(halfH, Math.abs(r.y), Math.abs(r.y + r.h));
  });
  return { nodes, halfW, halfH };
}

export default function Arena({ arenaState, onUpdate, onEndCompetition, onReplayHint, showToast }) {
  const [leftView, setLeftView] = useState('buzz');
  // 全班答案／題目／教師提示不是主畫面：平常只在上方中間放三顆小按鈕，點了才打開一個
  // 蓋在作答區上面的視窗，後面調暗、不能操作；點暗的地方、按 Esc 或再按一次同一顆就收回
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  useEffect(() => {
    if (leftCollapsed) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setLeftCollapsed(true); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leftCollapsed]);
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
  // 一場競賽只有 1 題、固定 2 個階段（原因、解方），所以 state 直接就是這一題的資料
  const subqId = state.currentSubQ;
  const stage = state.stages[subqId];
  const basicList = ARENA_CASE.stages[subqId - 1].basicAnswers;
  const buzzList = state.publicBuzz[subqId];
  const buzzClusters = clusterPublicBuzz(buzzList);
  const kmapLayout = layoutKmap(buzzClusters);
  // 畫布放不下全部方框時整體縮小（只縮不放大），四周留 16px
  const kmapFit = Math.min(1, (kmapCanvasSize.width / 2 - 16) / kmapLayout.halfW, (kmapCanvasSize.height / 2 - 16) / kmapLayout.halfH);

  // 只有「目前教師開放到的那個階段」才能繼續對話／送出答案；
  // 競賽暫停、或正在看已經做完的階段（例如進到解方後回頭看原因），都只能檢視，不能再互動
  const stageIsLive = subqId === state.unlockedSubQ;
  let lockReason = null;
  if (state.isArenaPaused) lockReason = '⏸ 競賽已暫停，恢復後才能繼續對話與送出答案。';
  else if (!stageIsLive) lockReason = '這個階段已經不是目前最新開放的階段，僅供查看，不能再對話或送出答案。';
  const interactive = !lockReason;

  // 切換案例／階段或這個階段有新訊息時，自動捲到對話最底部
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [subqId, stage.messages.length]);

  // 換階段時心智圖的縮放跟平移重置，不要延續上一個階段的視角——不然切階段後畫面
  // 可能還停留在上一個階段放大／拖到旁邊的位置，看起來像是當前階段的地圖是空的或跑版。
  useEffect(() => {
    setKmapZoom(1);
    setKmapPan({ x: 0, y: 0 });
  }, [subqId]);

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

  function gotoStage(n) {
    if (n > state.unlockedSubQ) return; // 鎖住的階段點了沒反應
    onUpdate((s) => setCurrentSubQ(s, n));
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
    onUpdate((s) => pushArenaUserMessage(s, subqId, val));
    setTimeout(() => {
      onUpdate((s) => resolveArenaAIReply(s, subqId, pendingIndex, isFirst));
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
    return `${subqId}|${text}`;
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
    onUpdate((s) => removeCandidateText(s, subqId, text));
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
    const { summary } = submitArenaAnswers(state, subqId, texts);
    onUpdate((s) => submitArenaAnswers(s, subqId, texts).state);
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
    onUpdate((s) => ({ ...s, matchSecondsLeft: s.matchSecondsLeft + 120, matchTotalSeconds: s.matchTotalSeconds + 120 }));
    showToast('教師已為全班加時');
  }

  function handleUnlockNextStage() {
    if (state.unlockedSubQ >= STAGE_COUNT) return;
    onUpdate((s) => unlockNextStage(s));
    showToast(`教師已開放${stageName(state.unlockedSubQ + 1)}`);
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
    const { summary } = submitArenaAnswers(state, subqId, [text]);
    onUpdate((s) => submitArenaAnswers(s, subqId, [text]).state);
    showToast(`（Demo）示範命中基本答案：${text}（+${summary.basicScore} 分）`);
  }

  // 計時長條：太空人從左邊出發，時間過了幾成就走到幾成的位置，時間到剛好抵達右邊的月球；
  // 剩 5 分鐘變黃、剩 1 分鐘變紅
  const timeLeftPct = Math.max(0, Math.min(100, (state.matchSecondsLeft / state.matchTotalSeconds) * 100));
  const elapsedPct = 100 - timeLeftPct;
  const timeLeftClass = state.matchSecondsLeft <= 60 ? ' stu-timebar-danger' : state.matchSecondsLeft <= 300 ? ' stu-timebar-warn' : '';

  return (
    <div className="stu-arena-main" onClick={handleArenaBackgroundClick}>
      <div className="stu-arena-status-row">
        <div className="stu-status-left">
          <span className="stu-status-dot" />
          <span className="stu-status-team">{state.myTeam}</span>
          <div className="stu-status-dots" title={`已答出 ${stage.revealed.length} / ${basicList.length} 格基本答案`}>
            {basicList.map((_, i) => (
              <svg className={`stu-status-star${stage.revealed.includes(i) ? ' stu-status-star-lit' : ''}`} viewBox="0 0 24 24" aria-hidden="true" key={i}>
                <path d={STAR_PATH} />
              </svg>
            ))}
          </div>
          <span className="stu-status-score">{state.myScore} 分</span>
        </div>
        <nav className="stu-arena-extras" aria-label="輔助資訊">
          {Object.entries(LEFT_PANEL_TABS).map(([id, label]) => {
            const on = !leftCollapsed && leftView === id;
            return (
              <button
                type="button"
                key={id}
                className={`stu-arena-extra-btn${on ? ' stu-arena-extra-btn-on' : ''}`}
                aria-expanded={on}
                onClick={() => {
                  if (on) { setLeftCollapsed(true); return; }
                  setLeftView(id);
                  setLeftCollapsed(false);
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>
        <div className="stu-timer-wrap">
          <div className="stu-timer">{formatMatchTime(state.matchSecondsLeft)}</div>
          <div className="stu-timer-label">全場剩餘時間</div>
        </div>
      </div>
      <div className={`stu-timebar${timeLeftClass}`} role="progressbar" aria-label="全場剩餘時間" aria-valuemin={0} aria-valuemax={state.matchTotalSeconds} aria-valuenow={state.matchSecondsLeft}>
        <div className="stu-timebar-lane">
          <div className="stu-timebar-fill" style={{ width: `${elapsedPct}%` }} />
          <div className="stu-timebar-astro" style={{ left: `${elapsedPct}%` }}><AstronautIcon /></div>
        </div>
        <MoonIcon />
      </div>

      {state.isArenaPaused && (
        <div className="stu-pause-banner">⏸ 競賽已暫停，倒數已凍結，請等待教師恢復。</div>
      )}

      <div className="stu-arena-layout-v2 stu-arena-layout-two">
        {!leftCollapsed && <div className="stu-knowledge-backdrop" onClick={() => setLeftCollapsed(true)} />}
        {!leftCollapsed && (
        <div className="panel stu-knowledge-panel stu-knowledge-drawer" role="dialog" aria-label={LEFT_PANEL_TABS[leftView]}>
          <div className="stu-drawer-head">
            <div>
              <div className="stu-drawer-title">{LEFT_PANEL_TABS[leftView]}</div>
              <div className="eyebrow">{LEFT_VIEWS[leftView]}</div>
            </div>
            <button type="button" className="stu-lpanel-collapse-btn" aria-label="關閉" title="關閉" onClick={() => setLeftCollapsed(true)}>✕</button>
          </div>

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
                  style={{ transform: `translate(${kmapPan.x}px, ${kmapPan.y}px) scale(${kmapZoom * kmapFit})` }}
                >
                  <div className="stu-kmap-origin">
                    <svg className="stu-kmap-lines" width="1" height="1" aria-hidden="true">
                      {kmapLayout.nodes.map((node) => (
                        <line
                          key={node.cluster.text}
                          x1="0" y1="0" x2={node.x} y2={node.y}
                          stroke={avatarColorFor(node.cluster.teams[0])} strokeWidth={1 + node.cluster.teams.length * 0.5} strokeOpacity=".55"
                        />
                      ))}
                    </svg>

                  <div className="stu-kmap-center">
                    <div className="stu-lpanel-subhead" style={{ marginBottom: 6, textAlign: 'center' }}>基本答案</div>
                    <div className="stu-basic-chip-row">
                      {basicList.map((answer, i) => {
                        const revealed = stage.revealed.includes(i);
                        return (
                          <span className={`stu-basic-chip${revealed ? ' stu-basic-chip-revealed' : ''}`} key={i}>
                            <svg className="stu-basic-chip-star" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR_PATH} /></svg>
                            <span className="stu-basic-chip-num">{i + 1}</span>
                            {revealed && <span className="stu-basic-chip-tip">{answer}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                    {kmapLayout.nodes.map((node) => (
                      <div className="stu-kmap-node" style={{ left: node.x, top: node.y, width: node.boxW, fontSize: node.fontSize, padding: `${node.padY}px ${node.padX}px` }} key={node.cluster.text}>
                        <div className="stu-kmap-node-teams">
                          {node.cluster.teams.map((team, i) => (
                            <span className="stu-kmap-node-team" style={{ background: avatarColorFor(team) }} key={team}>
                              {team}{i === 0 && ` +${node.cluster.score}`}
                            </span>
                          ))}
                        </div>
                        {node.lines.map((line, i) => <span className="stu-kmap-node-line" key={i}>{line}</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {buzzList.length === 0 ? (
                <div className="stu-observed-empty">還沒有人搶答，搶第一個！</div>
              ) : (
                <div className="stu-kmap-footer">
                  <span className="stu-slido-count">{buzzClusters.length} 個答案</span>
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
              <div className="stu-lpanel-subhead" style={{ margin: "0 0 8px" }}>{ARENA_CASE.tag}</div>
              {ARENA_CASE.brief.map((p, i) => <p className="stu-info-brief" key={i}>{p}</p>)}
              <div className="stu-lpanel-subhead" style={{ margin: "14px 0 8px" }}>階段</div>
              <div className="stu-info-list">
                {ARENA_CASE.stages.map((s, i) => {
                  const n = i + 1;
                  const locked = n > state.unlockedSubQ;
                  const dim = n !== state.unlockedSubQ;
                  if (locked) {
                    return <div className="stu-case-item stu-case-item-locked" title="教師還沒開放這個階段" key={n}>{stageName(n)} 🔒</div>;
                  }
                  return (
                    <button
                      type="button"
                      key={n}
                      className={`stu-case-item${subqId === n ? ' stu-case-item-active' : ''}${dim ? ' stu-case-item-dim' : ''}`}
                      onClick={() => gotoStage(n)}
                    >
                      {stageName(n)}：{s.title}
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
        )}

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
          <div className="eyebrow">與 AI 對話 · {stageName(subqId)}：{ARENA_CASE.stages[subqId - 1].title}</div>
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
        {state.unlockedSubQ < STAGE_COUNT && (
          <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleUnlockNextStage}>（Demo）教師開放解方階段</button>
        )}
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onEndCompetition}>（Demo）結束本場競賽 → 查看結果</button>
      </div>
    </div>
  );
}
