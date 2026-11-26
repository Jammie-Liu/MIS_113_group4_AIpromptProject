import { useEffect, useRef } from 'react';
import {
  ApiError, getBoard, getCompetition, getMe, getMessages, getPublicAnswers, secondsLeft,
  sendMessage, submitAnswers,
} from '../../api/student.js';

/*
  賽場接後端（docs/api-student.md 第 4～8 節）。

  Arena.jsx 原本整個畫面都靠一份本地的 arenaState（倒數、階段、對話、答案板、搶答區）。
  這裡不改那份資料的格式，只是改成「由後端的資料填進去」：
  - 進賽場時：拿自己的組別、賽場資訊、兩個階段的對話紀錄，組出第一份 arenaState
  - 之後每 2 秒：更新倒數／暫停／目前階段、自己這組的答案板、全班的公開搶答區
  - 老師結束競賽（status = ended）→ onEnded()；通行碼失效 → onLost()
  送訊息、送答案則用下面的 sendArenaMessage、submitArenaAnswersLive（Arena.jsx 呼叫）。

  沒接後端的部分先維持示範：教師提示（hints）、本場累計分數（myScore，只算這次送出拿到的分，重新整理會歸零）。
*/

const POLL_MS = 2000;
const STAGE_TITLES = { 原因: '找出問題發生的原因', 解方: '提出應對方案' };

const teamLabel = (groupId) => `第 ${groupId} 組`;

// 後端的對話紀錄 → Arena 用的訊息格式
function toArenaMessages(messages) {
  return messages.map((m) => (m.role === 'ai'
    ? { role: 'ai', points: m.points ?? [], pending: false }
    : { role: 'user', text: m.content }));
}

// 後端的賽場資訊 → arenaState 裡跟時間、階段有關的欄位
function timingFields(c, receivedAt) {
  const total = c.stageMinutes * 60;
  return {
    matchTotalSeconds: total,
    matchSecondsLeft: secondsLeft(c, receivedAt) ?? total,
    isArenaPaused: c.status === 'paused',
    unlockedSubQ: Math.max(1, c.currentStage),
  };
}

async function loadInitialState() {
  const me = await getMe();
  const c = await getCompetition();
  const receivedAt = Date.now();
  const opened = [1, 2].filter((n) => n <= c.currentStage);
  const histories = await Promise.all(opened.map((n) => getMessages(n)));
  const stages = {};
  const publicBuzz = {};
  const basicLists = {};
  [1, 2].forEach((n) => {
    const history = histories[opened.indexOf(n)];
    stages[n] = {
      messages: history ? toArenaMessages(history.messages) : [],
      revealed: [],
      submittedTexts: [],
      manualCandidates: [],
    };
    publicBuzz[n] = [];
    basicLists[n] = Array(c.stages.find((s) => s.stage === n)?.boardSize ?? 0).fill(null);
  });
  return {
    ...timingFields(c, receivedAt),
    currentSubQ: Math.max(1, c.currentStage),
    stages,
    publicBuzz,
    basicLists, // 每個階段的答案板：亮了的格子是答案文字，還沒亮的是 null
    caseInfo: {
      tag: c.topic,
      brief: [c.content],
      stages: c.stages.map((s) => ({ type: s.type, title: STAGE_TITLES[s.type] ?? s.type })),
    },
    hints: [],
    myTeam: teamLabel(me.groupId),
    myScore: 0,
    live: true, // 有接後端：Arena.jsx 用這個決定要不要藏起 Demo 教師按鈕
  };
}

// 每 2 秒拿一次最新狀態，套進 arenaState
async function refresh(setArenaState) {
  const c = await getCompetition();
  const receivedAt = Date.now();
  const opened = [1, 2].filter((n) => n <= c.currentStage);
  const boards = await Promise.all(opened.map((n) => getBoard(n)));
  const buzzes = await Promise.all(opened.map((n) => getPublicAnswers(n)));

  setArenaState((prev) => {
    if (!prev) return prev;
    const next = { ...prev, ...timingFields(c, receivedAt), stages: { ...prev.stages }, publicBuzz: { ...prev.publicBuzz }, basicLists: { ...prev.basicLists } };
    // 老師開放了新的階段：自動切過去
    if (c.currentStage > prev.unlockedSubQ) next.currentSubQ = c.currentStage;
    opened.forEach((n, i) => {
      const board = boards[i];
      next.basicLists[n] = board.cells.map((cell) => (cell.revealed ? cell.content : null));
      next.stages[n] = { ...prev.stages[n], revealed: board.cells.filter((cell) => cell.revealed).map((cell) => cell.index) };
      next.publicBuzz[n] = buzzes[i].answers.map((a) => ({
        team: teamLabel(a.groupId), text: a.content, score: a.score, at: new Date(a.time).getTime(),
      }));
    });
    return next;
  });
  return c;
}

export function useArenaSync({ active, setArenaState, onEnded, onLost }) {
  const handlersRef = useRef({ onEnded, onLost });
  handlersRef.current = { onEnded, onLost };

  useEffect(() => {
    if (!active) return undefined;
    let stopped = false;
    let timer = null;

    const handleError = (err) => {
      if (err instanceof ApiError && err.status === 401) { handlersRef.current.onLost(); return true; }
      console.warn('賽場同步失敗，稍後重試：', err.message); // 網路不穩時下一輪會再試
      return false;
    };

    const tick = async () => {
      try {
        const c = await refresh(setArenaState);
        if (c.status === 'ended') { handlersRef.current.onEnded(); return; }
      } catch (err) {
        if (handleError(err)) return;
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };

    (async () => {
      try {
        const initial = await loadInitialState();
        if (stopped) return;
        setArenaState(initial);
        tick();
      } catch (err) {
        if (!handleError(err) && !stopped) timer = setTimeout(() => window.location.reload(), 3000);
      }
    })();

    return () => { stopped = true; clearTimeout(timer); };
  }, [active]);
}

/* ---------- Arena.jsx 送出用 ---------- */

// 送訊息拿 AI 回覆；回傳 Arena 格式的 AI 訊息 { role: 'ai', points, pending: false }
export async function sendArenaMessage(stage, text) {
  const { aiMessage } = await sendMessage(stage, text);
  return { role: 'ai', points: aiMessage.points ?? [], pending: false };
}

// 送答案；回傳跟示範版一樣格式的 summary，Arena.jsx 的提示文字不用改
export async function submitArenaAnswersLive(stage, texts) {
  const { results, summary } = await submitAnswers(stage, texts);
  return {
    results,
    summary: {
      basicCount: summary.basicCount,
      basicScore: results.filter((r) => r.result === 'basic').reduce((s, r) => s + r.score, 0),
      publicCount: summary.publicCount,
      publicScore: results.filter((r) => r.result === 'public').reduce((s, r) => s + r.score, 0),
      dupCount: summary.duplicateCount,
      totalScore: summary.totalScore,
    },
  };
}
