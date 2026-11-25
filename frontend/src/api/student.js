/*
  學生端呼叫後端的函式（規格：docs/api-student.md）。

  畫面只要 import 這裡的函式，不用自己寫 fetch、帶通行碼、處理錯誤格式：

    import { joinCompetition, getGroups, ApiError } from '../../api/student.js';

    try {
      const me = await joinCompetition('000000', '王小明');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'COMPETITION_NOT_FOUND') { ...顯示「找不到這個代碼」 }
    }

  - 開發時前後端都要開：後端 `cd backend && npm run dev`（port 3000）、前端 `npm run dev`。
    vite.config.js 的 proxy 會把 /api 轉給後端，所以這裡只寫相對路徑。
  - 通行碼（token）加入時拿到，存在 sessionStorage：重新整理頁面還在；關掉分頁就沒了。
    每個分頁各自一份，所以開兩個分頁就能模擬兩個學生。
  - 後端回錯誤時會丟出 ApiError，帶 status（HTTP 狀態碼）、code（例如 'STAGE_NOT_OPEN'）、message（可以直接顯示給學生的中文）。
    錯誤碼列表見 docs/api-student.md 第 9 節。
*/

const BASE = '/api/v1/student';
const TOKEN_KEY = 'mis113.studentToken';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/* ---------- 通行碼 ---------- */

export function getToken() {
  try { return window.sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}

function setToken(token) {
  try { window.sessionStorage.setItem(TOKEN_KEY, token); } catch (e) { /* 瀏覽器不給存就算了 */ }
}

// 離開競賽、或後端說通行碼不對（401）時清掉
export function clearToken() {
  try { window.sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
}

// 有沒有加入過（例如重新整理後，用來決定要不要直接回賽場）
export function hasToken() {
  return Boolean(getToken());
}

/* ---------- 共用的 fetch ---------- */

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // 根本連不到後端（後端沒開、網路斷了）
    throw new ApiError(0, 'NETWORK_ERROR', '連不到伺服器，請檢查網路或稍後再試');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) clearToken();
    const err = data?.error;
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN_ERROR', err?.message ?? `伺服器回應錯誤（${res.status}）`);
  }
  return data;
}

/* ---------- 1～3 加入、我的資料、選組 ---------- */

// 1. 用賽場代碼＋名字加入；成功後自動存好通行碼
//    回傳 { studentId, name, groupId, competitionId }
export async function joinCompetition(code, name) {
  const { token, ...me } = await request('POST', '/join', { code, name });
  setToken(token);
  return me;
}

// 2. 用存著的通行碼找回自己的狀態：{ studentId, name, groupId, competitionId }
export function getMe() {
  return request('GET', '/me');
}

// 3.1 各組名單：{ groupCount, groups: [{ groupId, members: [{ studentId, name }] }] }
export function getGroups() {
  return request('GET', '/groups');
}

// 3.2 加入或換到第 groupId 組；傳 null 是離開這組。回傳跟 getMe 一樣
export function setGroup(groupId) {
  return request('PUT', '/group', { groupId });
}

/* ---------- 4 賽場資訊 ---------- */

// { competitionId, code, topic, content, groupCount, stageMinutes, currentStage, status,
//   stageEndsAt, remainingSec, serverTime, stages: [{ stage, type, boardSize }] }
export function getCompetition() {
  return request('GET', '/competition');
}

/*
  倒數還剩幾秒（給畫面用的小工具）：
  - 進行中：用伺服器時間算（學生電腦時鐘不準也沒關係），再扣掉「拿到資料後過了多久」
  - 暫停：停在 remainingSec
  - 還沒開始、已結束：null
  用法：拿到 getCompetition() 的結果時記下 receivedAt = Date.now()，之後每秒呼叫一次
    secondsLeft(competition, receivedAt)
*/
export function secondsLeft(competition, receivedAt) {
  if (!competition) return null;
  if (competition.status === 'paused') return competition.remainingSec ?? null;
  if (competition.status !== 'running' || !competition.stageEndsAt) return null;
  const leftAtServer = (new Date(competition.stageEndsAt) - new Date(competition.serverTime)) / 1000;
  const elapsed = (Date.now() - receivedAt) / 1000;
  return Math.max(0, Math.floor(leftAtServer - elapsed));
}

/* ---------- 5 跟 AI 對話 ---------- */

// 5.1 這個階段的對話（stage：1＝原因、2＝解方）
//     { stage, messages: [{ messageId, role, content, points?, time }] }，AI 的訊息才有 points
export function getMessages(stage) {
  return request('GET', `/messages?stage=${encodeURIComponent(stage)}`);
}

// 5.2 送一則訊息、拿 AI 回覆：{ studentMessage, aiMessage }
export function sendMessage(stage, content) {
  return request('POST', '/messages', { stage, content });
}

/* ---------- 6～8 答案 ---------- */

// 6. 一次送出好幾個勾選的列點
//    { results: [{ content, result: 'basic'|'public'|'duplicate', boardIndex?, score }],
//      summary: { basicCount, publicCount, duplicateCount, totalScore } }
export function submitAnswers(stage, contents) {
  return request('POST', '/answers', { stage, contents });
}

// 7. 自己這組的答案板：{ stage, boardSize, cells: [{ index, revealed, content?, byName? }] }
export function getBoard(stage) {
  return request('GET', `/board?stage=${encodeURIComponent(stage)}`);
}

// 8. 公開搶答區：{ stage, answers: [{ answerId, groupId, studentName, content, score, time }] }
export function getPublicAnswers(stage) {
  return request('GET', `/public-answers?stage=${encodeURIComponent(stage)}`);
}

/* ---------- 定時更新（輪詢） ---------- */

/*
  每隔 intervalMs 呼叫一次 fetcher，結果交給 onData，錯誤交給 onError（可不傳）。
  回傳一個「停止」函式，React 裡這樣用（畫面離開時會自動停）：

    useEffect(() => poll(getGroups, setGroups, 2000), []);

  上一次還沒回來就不會再發下一次，避免網路慢的時候請求越積越多。
*/
export function poll(fetcher, onData, intervalMs = 2000, onError) {
  let stopped = false;
  let timer = null;
  const tick = async () => {
    try {
      const data = await fetcher();
      if (!stopped) onData(data);
    } catch (err) {
      if (!stopped && onError) onError(err);
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };
  tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
