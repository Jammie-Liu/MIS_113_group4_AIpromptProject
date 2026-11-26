# 學生端前後端串接進度

- 狀態：2026-11-25（Celine-MuMu＋Claude Code）
- 這份給全組看：學生端**哪些已經接上後端（真的資料）**、**哪些還是假資料**、測試用的東西在哪、接下來缺什麼
- API 規格：[api-student.md](api-student.md)；前端呼叫 API 的函式：`frontend/src/api/student.js`

---

## 一、一眼看懂

| 畫面 | 狀態 | 說明 |
|---|---|---|
| 輸入賽場代碼＋名字 | ✅ 已接後端 | 真的加入競賽，拿到通行碼 |
| 選擇組別 | ✅ 已接後端 | 各組名單是資料庫的真實資料，每 2 秒更新 |
| 賽場 | 🟡 大部分接好 | 題目、倒數、對話、送答案、答案板、搶答區都是真的；教師提示、本場分數還是前端自己的 |
| 結果頁 | ❌ 還是假資料 | 結果頁的 API 還沒寫 |
| 老師的開始／暫停／開放解方／結束 | 🧪 測試用 | 教師端 API 還沒寫，先用學生端的「（Demo）」按鈕操作（見第四節） |
| AI 回覆、答案「像不像」的判斷 | 🧪 後端暫時版 | 格式是正式的，但內容是假的（見第三節） |

---

## 二、已經接上後端的

| 功能 | 呼叫的 API | 程式在哪 |
|---|---|---|
| 加入賽場（代碼＋名字） | `POST /student/join` | `StudentApp.jsx` 的 `handleNameJoin` |
| 重新整理後自動回到原本的畫面 | `GET /student/me` | `StudentApp.jsx`（通行碼存在 sessionStorage，每個分頁各一份） |
| 通行碼失效（例如資料被重置）就回到輸入代碼 | 任何 API 回 401 | `StudentApp.jsx` 的 `handleLostSession` |
| 選組、換組、離開 | `GET /student/groups`、`PUT /student/group` | `screens/TeamForm.jsx` |
| 老師開始後自動進賽場；遲到的人選好組直接進去 | `GET /student/competition`（看 `status`） | `screens/TeamForm.jsx` |
| 題目名稱、題目敘述、兩個階段 | `GET /student/competition` | `useArenaSync.js` |
| 倒數（全班共用，遲到的人剩得比較少）、暫停、目前階段 | `GET /student/competition`（`stageEndsAt`、`serverTime`、`status`、`currentStage`） | `useArenaSync.js` |
| 老師開放解方時自動切到階段二；老師結束時自動到結果頁 | 同上 | `useArenaSync.js` |
| 跟 AI 對話（含重新整理後的對話紀錄） | `GET`／`POST /student/messages` | `useArenaSync.js`、`screens/Arena.jsx` 的 `sendPrompt` |
| 送出答案（命中基本答案、搶答、重複不計分都由後端判斷；分數：基本答案 0.5、搶答 1、重複 0，2026-11-26 確認） | `POST /student/answers` | `screens/Arena.jsx` 的 `submitLive` |
| 自己這組的答案板（星星、亮了的答案） | `GET /student/board` | `useArenaSync.js` |
| 全班的答案（公開搶答區） | `GET /student/public-answers` | `useArenaSync.js` |

賽場每 2 秒同步一次（`useArenaSync.js`）；`Arena.jsx` 本身的畫面幾乎沒改，只是資料來源換成後端。

---

## 三、還是假資料／還沒接的

| 項目 | 現在怎麼做 | 要接需要什麼 | 誰 |
|---|---|---|---|
| **結果頁**（全班答案地圖、各組互評、我的成績單） | `screens/Results.jsx` 讀 `teacher/data.js` 的 `RESULT_TEAMS` 等假資料 | 結果頁 API（含互評要不要存資料庫） | 後端＋學生端前端 |
| **教師提示** | 只存在自己的畫面（「教師推播提示」按鈕加一則示範提示） | 資料庫要有提示的表、老師推播的 API、學生拿提示的 API | 後端＋教師端 |
| **本場分數**（賽場左上角的「N 分」） | 前端把這次送出拿到的分數加總，**重新整理會歸零** | 後端回傳自己的總分（或從 `stu_ans` 算） | 後端 |
| **AI 回覆** | 後端回固定的示範列點（`backend/Services/aiService.js`） | 串真的 AI | 串 AI 的組員 |
| **答案「像不像」** | 後端用簡單的文字比對（`backend/Services/answerMatch.js`） | 換成 AI 判斷 | 串 AI 的組員 |
| **剩五分鐘提示**、敏感字詞檢查 | 前端自己判斷 | 不用接，維持前端 | — |
| 預填的賽場代碼 `000000` | `StudentApp.jsx` 的 `TEST_ARENA_CODE`，跟假資料那場競賽一樣 | 正式上線前拿掉預填 | 學生端前端 |

---

## 四、測試用的東西（正式上線前要拿掉）

### Demo 老師按鈕

教師端 API 還沒寫，學生端先放這些按鈕，**按了會真的改資料庫裡的競賽狀態**，所有學生的畫面 2 秒內都會跟著變：

| 位置 | 按鈕 |
|---|---|
| 選擇組別 | （Demo）老師開始競賽 → 進入賽場 |
| 賽場下方 | 教師暫停／恢復、加時 +2 分鐘、開放解方階段、結束本場競賽、教師推播提示（只在自己畫面） |

- 前端：`api/student.js` 的 `devCompetition()`
- 後端：`backend/Routes/dev.js`（只在開發環境開放，`NODE_ENV=production` 時不會有）
- 教師端寫好開始／暫停／開放階段／結束的 API 後，這些按鈕和 `dev.js` 都可以刪掉

### 假資料（資料庫）

`backend` 資料夾跑 `npm run seed` 會清空並放回固定的假資料：競賽代碼 `000000`、4 組、3 個假同學、題目「供應鏈勞動爭議」。
按了「結束」之後那場競賽就不能再開始，想重玩就再跑一次 seed（大家要重新輸入代碼加入）。

---

## 五、已經註解掉的假資料（改接後端後用不到，先保留）

每一段上面都有 `⬇ 已改接後端…` 的說明；確定不用之後再刪，要恢復就拿掉 `//`。

| 檔案 | 註解掉的東西 | 改由誰決定 |
|---|---|---|
| `pages/student/data.js` | `MATCH_DURATION_SECONDS`（固定倒數） | 後端 `stage_ends_at` |
| | `ARENA_CASE` 的 `brief`、兩個階段的 `basicAnswers` | `GET /student/competition`、`/board` |
| | `matchBasicAnswer`、`isDuplicateInPublicBuzz`、`publicBuzzScore`、`submitArenaAnswer(s)` | `POST /student/answers` |
| | `generateArenaPoints`、`resolveArenaAIReply`（假 AI 列點） | `POST /student/messages` |
| | `unlockNextStage` | 後端 `current_stage` |
| | `freshArenaState`、`freshStageState`（假的搶答紀錄、「C 隊」） | `useArenaSync.js` |
| `screens/Arena.jsx` | 送訊息、送答案的示範版分支；「示範答對一格基本答案」按鈕 | 後端（前端拿不到還沒亮的答案，避免偷看） |
| `StudentApp.jsx` | 開新比賽時放假資料的那段 | `useArenaSync.js` |
| `screens/TeamForm.jsx` | 假同學陸續加入、每組 3 人上限（整段改寫，舊版在 git 紀錄裡） | `GET /student/groups`；每組不設上限 |

**還在用、沒有註解的**：`ARENA_CASE.tag` 和兩個階段的名稱（結果頁、階段標題在用）、`textSimilarity`／`clusterPublicBuzz`（「全班的答案」把相似答案併成一框）、`DEMO_HINT_TEXT`／`pushHint`（教師提示）。

---

## 六、怎麼跑起來測

1. 後端：`cd backend && nvm use 22 && npm run dev`（AWS 過期就先 `aws login`）
2. 前端：另開一個終端機 `cd frontend && nvm use 22 && npm run dev`
3. 打開前端網址 → Student → 代碼 `000000` → 名字 → 選組 → 按「（Demo）老師開始競賽」
4. 想模擬好幾個學生：多開幾個分頁，各自加入
5. 測完：`cd backend && npm run seed` 還原

資料庫在雪梨，每次請求約半秒；資料庫閒置一陣子會睡著，第一次要等十幾秒（見 [db-todo.md](db-todo.md)）。

---

## 七、接下來

- [ ] **教師端 API**：開始／暫停／加時／開放階段／結束（寫好後拿掉 Demo 按鈕和 `dev.js`）
- [ ] **結果頁 API**
- [ ] **教師提示**：資料表＋API
- [ ] **本場分數**改由後端算
- [ ] **串真的 AI**：`aiService.js`、`answerMatch.js`
- [ ] 正式上線前：拿掉預填代碼 `000000`、Demo 按鈕、`dev.js`；刪掉第五節註解掉的假資料
