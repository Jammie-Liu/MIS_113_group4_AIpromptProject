# 教師端 API 清單（草稿，待後端確認）

這份文件整理「教師端」每個畫面需要向後端要什麼資料、送出什麼動作，給後端在開發前先確認。
依據是目前教師端前端（`frontend/src/pages/teacher/`）的實際畫面與假資料（`data.js`），
欄位名稱沿用前端現有的命名，之後如果後端有不同習慣，請直接在這份文件上改，前端再跟著調整。

> 狀態：**草稿**。依 CLAUDE.md 的規則，API 規格要前後端先對好再各自開發，所以請後端確認過再定案。
> 學生端的 API 不在這份文件裡（教師端只需要看到學生端產生的資料）。

## 0. 通用約定（建議，待確認）

| 項目 | 建議 |
|---|---|
| 路徑前綴 | `/api/v1` |
| 格式 | JSON、UTF-8；欄位用 camelCase（跟前端假資料一致） |
| 驗證 | 登入後取得 token（Cookie 或 `Authorization: Bearer`，由後端決定）；教師端 API 一律要求角色是 `teacher` |
| 權限 | 老師只能存取「自己的課程」與其底下的競賽；系統內建題庫只能讀、不能改刪 |
| 時間 | ISO 8601（UTC），例如 `2026-10-10T08:30:00Z`；倒數用 `endsAt` 讓前端自己倒數，不用每秒打 API |
| ID | 字串 |
| 錯誤格式 | HTTP 狀態碼 ＋ `{ "error": { "code": "CASE_NOT_FOUND", "message": "找不到題庫" } }` |
| 列舉值 | 難度 `bronze｜silver｜gold｜diamond`（畫面顯示青銅／白銀／黃金／鑽石）；題庫公開狀態 `public｜private`；隊伍狀態 `discussing｜submitted｜stalled｜graded`（`submitted` ＝全隊都已提交） |
| 即時更新 | 監控台需要即時資料，建議用 WebSocket（或 SSE），見第 5 節 |
| 4D 代號 | `D1` 委託（Delegation）、`D2` 描述（Description）、`D3` 辨識（Discernment）、`D4` 盡責（Diligence）；整份文件（課程 4D 統計、評分明細）都用這個對應，跟 `docs/scoring-design.md` 表格的列出順序不同，請以代號為準 |

對應 `docs/architecture.md` 的 Controller：登入 → authController；題庫 → bankController；
隊伍即時狀態 → teamController；評分 → gradingController；提示推播 → hintController。

---

## 1. 登入與個人資料

優先度最高（CLAUDE.md：登入／角色／權限最優先）。

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| POST | `/auth/login` | 登入 | 送：`email`、`password`；回：`token`、`user{id,name,role}` |
| POST | `/auth/logout` | 登出（設定頁） | — |
| GET | `/me` | 取得目前登入的老師資料（設定頁、側邊欄、首頁歡迎語） | `id`、`name`、`email`、`department`、`title`、`joinedAt`、`stats{courseCount,competitionCount}` |
| PATCH | `/me` | 修改顯示名稱 | 送：`displayName` |
| POST | `/me/password` | 修改密碼 | 送：`currentPassword`、`newPassword` |
| GET | `/me/settings` | 取得通知與競賽預設值 | `notifications{stallAlert}`（競賽中不做即時幻覺偵測，所以沒有幻覺提醒）、`competitionDefaults{stallThresholdSeconds}` |
| PATCH | `/me/settings` | 更新上述設定 | 同上（部分欄位即可） |

註：互動音效與音效風格只存在瀏覽器（localStorage），不需要 API。

## 2. 課程（首頁、課程詳情）

依 `docs/system-flow.md` 三「我的課程」與資料庫 `Course`、`CourseMembership`。

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/courses` | 首頁課程卡片、側邊欄的課程清單 | `[{id,term,title,schedule,studentCount,competitionCount,visibility,capacity,pendingCount,icon}]` |
| POST | `/courses` | 「開設課程」 | 必填：`title`、`intro`、`visibility`（`public｜private`）、`capacity`（≥1 整數）、`publishAt`；選填：`endAt`（預設發布後半年）、`price`、`tags[]`；回：課程資料與 `joinCode`（6 碼課程代碼） |
| GET | `/courses/:courseId` | 課程詳情 | `id`、`term`、`title`、`intro`、`schedule`、`studentCount`、`visibility`、`capacity`、`publishAt`、`endAt`、`price`、`tags`、`syllabus{…}` |
| GET | `/courses/:courseId/join` | 邀請學生加入（課程代碼、連結、QR Code） | `{code,joinUrl,qrUrl}` |
| GET | `/courses/:courseId/students` | 「學生與小組」頁籤的學生名單（含新加入的） | `[{id,name,department,email,avgScore,attendance}]` |
| POST | `/courses/:courseId/students` | 老師直接加入學生 | 送 `name`、`email`；人數已達 `capacity` 回 409；對應 `CourseMembership.status = approved` |
| POST | `/courses/:courseId/students/batch` | 批次匯入學生（老師上傳 Excel／CSV，前端讀檔、預覽後送出） | 送 `students: [{name,email,department}]`（前端已排除缺姓名、信箱格式錯、已在名單、已在待審核、檔案內重複的）；後端照順序加入到人數上限為止，回 `{ added: [{id,name,email}], skipped: [{email, reason: "exists｜pending｜full｜invalid"}] }`；**待後端確認**：前端讀檔還是改成上傳檔案由後端讀 |
| GET | `/courses/:courseId/join-requests` | 私人課程待審核的加入申請 | `[{id,studentName,department,email,requestedAt}]`（`CourseMembership.status = pending`） |
| PATCH | `/courses/:courseId/join-requests/:requestId` | 核准或拒絕 | 送 `{ "decision": "approve｜reject" }`；核准時人數已滿回 409 |
| GET | `/courses/:courseId/groups` | 「學生與小組」頁籤的小組名單（前端用成員名單對應出每位學生的小組，篩選也在前端做） | `{mode:"random"｜"manual", groups:[{id,name,color,members:[{id,name}]}]}`；預設 `mode` 是 `random`（系統隨機分組），競賽時就用這份分組 |
| PUT | `/courses/:courseId/groups` | 手動調整（拖拉換組）後按「完成」存檔 | 送整份 `{mode:"manual"｜"random", groups:[{name,memberIds[]}]}`；空的小組前端已先移除，名稱依序為 A 隊、B 隊…；**待確認**：已發起或進行中的競賽不受影響，只套用到下一場 |
| GET | `/courses/:courseId/competitions` | 過往競賽紀錄頁籤 | `[{id,title,date,teamCount,championTeamName,top3[{rank,teamName,members[]}],fourD}]`，`fourD` 見下 |
| GET | `/courses/:courseId/fourd-stats` | 「4D 能力成長」頁籤：這門課各場競賽的 4D 統計（由新到舊或由舊到新皆可，前端自己排序） | `[{competitionId,title,date,fourD}]` |

`fourD`（課程 4D 統計，競賽結束後由系統寫入課程資料庫，docs/scoring-design.md 四）：

```json
{ "D1": { "mean": 16.3, "p75": 17.8, "p25": 14.8, "median": 17.5, "sd": 2.7, "n": 11 }, "D2": {…}, "D3": {…}, "D4": {…} }
```

- 以**每位學生各回合平均**的 4D 分數為資料，四個維度分開算；每個維度滿分 25；`p75` 高標、`p25` 低標（第 75、25 百分位）；`sd` 用母體標準差（待確認）。
- 競賽「確認評分」或「跳過評分」公布結果的同時寫入（資料回存），前端不用另外呼叫寫入的 API。
- 公開課程學生用代碼加入自動 `approved`；私人課程加入後為 `pending`，要老師核准。

## 3. 題庫管理

### 3.1 題庫

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| GET | `/bank/cases` | 題庫清單 | 篩選：`categoryId`（`none` ＝未分類）、`difficulty`、`source`（`system｜teacher`）；回傳摘要欄位（見下） |
| GET | `/bank/cases/:caseId` | 題庫詳情（點開卡片的視窗、監控台的本題題目） | 回傳完整欄位 |
| POST | `/bank/cases` | 新增題庫（老師自建） | 送完整欄位；回傳新題庫 |
| PATCH | `/bank/cases/:caseId` | 修改題庫 | **只有自己建立的**可以改；系統內建回 403 |
| DELETE | `/bank/cases/:caseId` | 刪除題庫 | 同上，只有自己建立的 |
| POST | `/bank/cases/:caseId/baseline` | 「重新產生基準答案」 | 後端重新跑基準答案（回答 AI 3 次＋評分 AI 評等級）；先回 `status: generating`，完成後 `GET` 題庫詳情可取得 |

題庫欄位：

| 欄位 | 說明 |
|---|---|
| `id`、`name` | 案例名稱 |
| `difficulty` | 難度（列舉見第 0 節） |
| `categoryId` | 分類；`null` ＝「未分類」 |
| `industry` | 產業（自由填寫的細項，例如「電商／零售」） |
| `issue` | 議題（學生看得到） |
| `background` | 背景（學生看得到） |
| `task` | 任務（學生看得到） |
| `stakeholders` | 利害關係人，字串陣列（答案參考庫；只有評分 AI 與老師看得到）。原本的 `roles`（角色與立場）併入這裡 |
| `facets` | 主要面向，字串陣列（答案參考庫；評分 AI 的 B 涵蓋面向、面向偵測 AI 與知識地圖的官方面向來源）。原本的 `checklist` 改名 |
| `informationGap`、`tension` | 資訊落差、兩難張力：選填，只當老師的出題輔助，**不給學生看**，AI 不使用 |
| `baseline` | 基準答案，系統自動產生、老師不能直接編輯（見下方） |
| `questionCount` | 題目數，目前固定 1 |
| `visibility` | `public`（所有教師可用）｜`private`（僅本人） |
| `source` | `system`（系統內建）｜`teacher`（老師建立） |
| `ownerId`、`ownerName` | 建立者 |

依 `docs/scoring-design.md` 二「題庫欄位」：

- **不設幻覺陷阱欄位**（原本的 `hallucinationTrap` 拿掉）：幻覺由評分 AI 依解方評分 D 的標準判斷。
- 欄位名稱、型別、必填與否，**要跟競賽後端（芷琳）確認**後再定（Issue #49）。

`baseline`（基準答案，建立或修改議題／背景／任務／面向時由後端自動產生；也可以呼叫上方的「重新產生」）：

```json
{
  "status": "ready",
  "generatedAt": "2026-10-16T08:00:00Z",
  "facets": [
    { "facet": "動物福利", "level": 2, "summary": "基本提問就會談到動物受虐與壓力" },
    { "facet": "禁止後動物如何安置", "level": 0, "summary": "" }
  ],
  "extraFacets": ["觀眾教育"],
  "answers": ["第 1 次基準回答全文", "第 2 次…", "第 3 次…"],
  "publishable": true
}
```

- `status`：`generating｜ready｜failed`；`level`：該面向 3 次中最高的涵蓋程度（0／1／2）；
  `extraFacets`：基準新面向（基本提問就出現、但參考庫沒有的面向，不算 C 新面向加分）。
- `publishable`：所有面向 `level` 都是 2 時為 `false`（太簡單，不能發布），發起競賽時不能選這一題。

清單摘要欄位：`id、name、difficulty、categoryId、industry、visibility、source、ownerName、questionCount、issue、background（前 60 字）、baseline.publishable`。

### 3.2 分類

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| GET | `/bank/categories` | 側邊欄與選題用的分類清單 | `[{id,name,color,description,caseCount}]`；「未分類」是虛擬分類（`categoryId = null`），只有裡面有題庫時前端才顯示 |
| POST | `/bank/categories` | 新增分類 | 送 `name`（最多 12 字、不可重名）、`color`；老師自建的分類建議每位老師獨立，**待確認**是否全站共用 |
| DELETE | `/bank/categories/:categoryId` | 刪除分類 | 裡面的題庫**不會被刪**，`categoryId` 設成 `null`（移到未分類） |
| PATCH | `/bank/categories/:categoryId` | 重新命名／改色（前端還沒做，先預留） | — |

預設六類：供應鏈與營運、人力資源與勞動、行銷與定價、財務與投資、科技與資安、品牌與公關。

## 4. 發起競賽

依 `docs/system-flow.md` 六：題庫、回合數（預設 2）、每回合時限（預設 20 分鐘）、發布時間（可排程）、其他說明。

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| POST | `/courses/:courseId/competitions` | 按「完成」建立競賽 | 送：`caseId`、`roundCount`（預設 2，前端限制 1～5）、`timeLimitMinutes`（每回合，預設 20，前端限制 5～60、每 5 分鐘一格）、`publishAt`（`null` ＝ 立即發布；有值 ＝ 排程）、`description`（其他說明，選填，最多 300 字）；回：`id`、`code`（6 碼，自動產生）、`joinUrl`、`qrUrl`、`status`（`scheduled｜ongoing｜ended`，對應資料庫 `Competition.status`） |
| PATCH | `/competitions/:competitionId` | 修改尚未發布的競賽 | 只在 `scheduled` 狀態可改上述欄位 |
| DELETE | `/competitions/:competitionId` | 取消排程 | 只在 `scheduled` 狀態 |
| POST | `/competitions/:competitionId/start` | 排程中的競賽「現在就開始」，或立即發布後進入監控 | `status` 變 `ongoing`，開始第 1 回合倒數，回 `endsAt` |
| GET | `/courses/:courseId/competitions?status=scheduled` | 課程頁「已排程的競賽」清單 | `[{id,caseName,publishAt,roundCount,timeLimitMinutes,code}]` |
| GET | `/competitions/:competitionId` | 取得競賽基本資料 | `id`、`courseId`、`code`、`status`、`case{…}`、`roundCount`、`timeLimitMinutes`、`description`、`publishAt`、`startedAt`、`endsAt`、`paused` |

- 畫面在打開「發起競賽」視窗時就會顯示代碼（讓老師先分享給學生），所以代碼要在建立前就能先產生（例如先呼叫一支取得代碼的 API，或先建立 `scheduled` 狀態的草稿）。**待後端決定**。
- 排程時間一到，由後端把這場競賽放進課程的學生端頁面；教師端只負責設定與顯示。
- 分組：發起時顯示目前課程分組（系統隨機分組，可手動調整），競賽用這份分組寫入隊伍。

## 5. 即時監控台

### 5.1 一次取得快照（進入畫面時）

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/competitions/:competitionId/live` | 監控台快照 | 見下 |

回傳內容：

```json
{
  "round": { "number": 1, "total": 2, "phase": "playing｜voting｜scoring｜suggesting｜between｜finished", "completed": [] },
  "clock": { "endsAt": "…", "remainingSeconds": 1198, "paused": false },
  "teams": [
    { "id": "A", "name": "A 隊", "color": "#E8636B", "status": "submitted",
      "submittedCount": 2, "memberCount": 3,
      "coveragePercent": 64, "exchangeCount": 6, "hinted": false,
      "flags": [{ "type": "stalled", "text": "超過 90 秒無動作", "tone": "amber" }],
      "stalled": false, "flagged": false }
  ],
  "knowledgeMap": [ /* 見 5.3 */ ],
  "events": [ /* 最近 40 則，見 5.4 */ ]
}
```

- **競賽中不做即時評分**（`docs/scoring-design.md` 十一）：沒有每隊 AI 分數、每則訊息分數、全班即時 4D、即時幻覺偵測，這些都等回合結束、投票完成後由評分 AI 評一次。
- `submittedCount`／`memberCount`：已按「提交」的組員人數／組員人數，老師即時看到繳交情況；全隊都提交時 `status = submitted`。
- `phase = scoring`：評分 AI 評解方與 4D（4D 每回合都評）；`suggesting`：全班評完後，評分 AI 產生「本回合改善建議」（見 5.7），
  產生中老師也可以按「開始第 N 回合」，不會被擋住。
- `coveragePercent`：該隊已涵蓋的官方面向數 ÷ 官方面向總數，由後端用知識地圖資料計算，不另外呼叫 AI；每隊每 1～2 分鐘更新一次。
- 「需要你注意」清單前端會自己從 `teams.flags`（目前只有停滯）、`knowledgeMap`（沒人涵蓋的面向）組出來，後端不用另外做。
- `stalled` 的判斷（超過 `stallThresholdSeconds` 沒動作）由後端算。

### 5.2 老師的控制動作

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| POST | `/competitions/:competitionId/pause` | 暫停 | 學生端無法送出提示；倒數停止 |
| POST | `/competitions/:competitionId/resume` | 恢復 | — |
| POST | `/competitions/:competitionId/extend` | 加時 | 送 `minutes`（目前按鈕是 +1、+5；隊伍詳情的「節奏調整」建議是 +2）；回新的 `endsAt` |
| POST | `/competitions/:competitionId/rounds/end` | 老師提前結束目前這一回合（不是整場） | 只在 `phase = playing` 可用；直接進入匿名投票階段（例如時間還沒到、但學生都已提交） |
| POST | `/competitions/:competitionId/rounds/next` | 一回合評分完成後，老師按「開始第 N 回合」 | 只在 `phase = between` 可用；開始下一回合並重設倒數，學生的對話記憶清空；回新的 `round` 與 `endsAt` |
| POST | `/competitions/:competitionId/end` | 結束整場並評分 | 時間到時也會自動結束；之後進入評分流程。提早結束時，排名只計**已完成評分的回合**（進行到一半、還沒評分的回合不計入），解方、4D 兩個排名都一樣 |
| POST | `/competitions/:competitionId/hints` | 推送提示給學生 | 見 5.5 |
| GET | `/hint-cards` | 引導卡範本清單 | `[{key,title,description,text}]`，目前有：換視角引導卡、空白區域卡、節奏調整（監控台的「推送引導卡」用前兩種，節奏調整是隊伍詳情頁的提示建議）；競賽中不做即時幻覺偵測，所以拿掉幻覺警示卡 |

### 5.3 集體知識地圖（即時）

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/competitions/:competitionId/knowledge-map` | 取得地圖（快照已包含，這支給單獨重抓用） |

```json
[
  { "dim": "財務影響量化", "origin": "official",
    "teams": ["A", "B", "C"],
    "answers": { "A": { "studentId": "…", "studentName": "陳阿哲", "text": "前三個月物流成本約上升 15%…", "submitted": true, "basic": false } } },
  { "dim": "供應商違規紀錄查證", "origin": "team", "teams": ["B", "E"], "answers": { } }
]
```

- `origin`：`official`（題庫 `facets` 裡的面向）｜`team`（隊伍自創）。
- 學生按「提交」時，面向偵測 AI 另外對這份個人結果偵測一次，結果摘要加進 `answers`，並帶 `basic: true｜false`：
  `true` ＝只到基準答案的程度，地圖上標註「基本答案」（`docs/scoring-design.md` 十一）。
- 由**面向偵測 AI**（不是評分 AI）產生：每隊每 1～2 分鐘批次偵測一次該隊的新對話，只判斷「談到了哪些面向」，不打分、不判斷幻覺（`docs/scoring-design.md` 十一）。學生和老師都看得到，畫面標示「即時，不是正式評分」。
- `origin: team` 的面向是偵測到的可能新面向，只是地圖上的新分支，**不代表加分**；加分要等回合結束由評分 AI 確認。
- `answers`：每隊在這個面向的代表摘要（哪位同學說了什麼，一句話），由面向偵測 AI 產生；同一隊同一面向目前只放一位。
- 沒有隊伍涵蓋的面向 `teams` 是空陣列。

### 5.4 即時動態

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/competitions/:competitionId/events?limit=40&before=` | 即時動態清單（點「即時動態」視窗用） |

事件欄位：`id`、`teamName`（或 `全班`）、`kind`（`newDim` 新面向出現（知識地圖的新分支，不代表加分）｜`redundant` 重複涵蓋｜`hint` 老師提示｜`submitted` 組員提交）、`text`、`createdAt`。

競賽中不做即時幻覺偵測，所以沒有 `halluc` 事件；原本的 `point`（新面向加分）改成 `newDim`，加分要等評分 AI 確認。

### 5.5 推送提示

`POST /competitions/:competitionId/hints`

```json
{ "target": "all", "cardKey": "blank", "text": "目前全班還沒有人談到「執行時程與風險」…" }
```

- `target`：`"all"`（全班）或 `["A","C"]`（指定隊伍，隊伍詳情頁用）。
- 後端要把提示即時推給學生端（學生端右下角跳出提示條，幾秒後自動消失），並寫入即時動態。
- 暫停中不可推送（前端會停用按鈕，後端也要擋）。

### 5.6 隊伍詳情

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/competitions/:competitionId/teams/:teamId` | 隊伍詳情頁（對話紀錄、最終回答、已談到的面向） | 見下 |

```json
{
  "id": "A", "name": "A 隊", "status": "submitted",
  "members": [{ "id": "…", "name": "陳阿哲" }],
  "stats": { "exchangeCount": 6, "coveragePercent": 64, "submittedCount": 2, "memberCount": 3 },
  "messages": [
    { "studentId": "…", "studentName": "陳阿哲", "at": "02:10", "prompt": "…", "reply": "…" }
  ],
  "finalAnswer": { "studentName": "陳阿哲", "fullText": "投票選出的最終回答全文", "votes": 3, "totalVotes": 4 },
  "coverage": [{ "dim": "財務影響量化", "covered": true, "summary": "陳阿哲：前三個月物流成本約上升 15%" }]
}
```

- `messages`：該隊每位成員與 AI 的完整對話，依時間排序；競賽中沒有每則訊息的分數。
- `finalAnswer`：組內匿名投票選出的那位組員的個人結果（該組員聊天室中的最終解方），跟 6.3 的 `finalAnswer` 同一份；**不是 AI 整合的**。投票完成前是 `null`。
- `coverage`：即時知識地圖中這一隊談到的面向（面向偵測 AI，只有談到／沒談到），不是正式評分。
- 競賽中沒有 AI 分數、幻覺判斷；回合評分完成後的結果請看第 6 節。
- 隊伍詳情頁推送提示用 `POST /competitions/:competitionId/hints`（`target:["A"]`）。

### 5.7 本回合改善建議（只有老師看得到）

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/competitions/:competitionId/rounds/:roundNumber/suggestions` | 回合之間的「本回合改善建議」；競賽結束後在結果頁回看各回合 |

```json
{
  "round": 1, "status": "generating｜ready｜failed", "isFinal": false,
  "classSummary": [{ "point": "多數同學沒有查證 AI 給的數據", "indicators": ["辨-1"] }],
  "teams": [{ "teamId": "B", "points": [{ "issue": "大多是基本答案，組員很少追問", "indicators": ["描-8", "辨-3"], "suggestion": "提醒他們針對 AI 的回答再追問細節" }] }],
  "watchStudents": [{ "teamId": "C", "studentName": "…", "reason": "只送一則就提交，4D 總分 22，全班平均 61" }],
  "hintDrafts": ["AI 給的數字有來源嗎？試著請它說明出處。"],
  "comparedToLastRound": [{ "point": "辨-1 平均從 0.4 升到 1.1" }],
  "uncertainNote": "…"
}
```

- 由**競賽評分 AI** 在全班評分完成後另外呼叫一次產生（`docs/scoring-design.md` 十二），以學生使用 **4D** 的狀況為主；不影響任何分數。
- `hintDrafts` 可以一鍵帶入 5.5 的提示條編輯框，修改後再送；寫成引導性問題，不直接寫出答案參考庫的內容。
- `isFinal: true`（最後一回合）：內容改成整場競賽的 4D 總結，取代原本的「賽後亮點」「下堂課建議」。
- 完成時推 `suggestions.ready`（見第 7 節）。

## 6. 評分與總覽

依 `docs/scoring-design.md`（七、八）：評分 AI 判斷 0／1／2 與各種標記，分數由後端程式依公式計算；
老師**不能改 AI 的判斷**，只在**解方排名分數**與 **4D 排名分數**上分開**加減分（各 ±10 以內，評語選填）**，也可以「跳過評分」。

### 6.1 流程與狀態

`results.stage`：`0`（老師查看 AI 評分、加減分中）→ `1`（老師按了「確認評分」或「跳過評分」，已計算最終排名並公布）。

- 老師可以對每一隊分別設定解方調整、4D 調整（可以只調一個）與評語；評語**選填**，加減分時也可以不寫，有寫才會顯示在該隊的「老師評價」（`docs/scoring-design.md` 八）。
- 「跳過評分」＝ 所有隊伍兩個排名都調整 0 分、不留評語。
- 按下確認或跳過之後，才計算兩個最終排名，**各自**公布前三名（全班可見）；各隊只看得到自己兩個排名的分數、名次、互評留言與老師評價。
- 公布後不能再改調整分數。
- 總覽（兩個排名的頒獎台與最終排名、各回合改善建議）在公布前是鎖定的。

### 6.2 分數公式（後端計算）

```
A 基本要求：門檻，不給分；立場、配套各缺一項扣 10
B 涵蓋面向（0～90）：每個面向得分 ＝ max(0, 涵蓋程度 − 基準等級)
                     B ＝ 各面向得分加總 ÷ 各面向（2 − 基準等級）加總 × 90（基準等級已是 2 的面向不列入）
解方分數（0～100）＝ B ＋ C 新面向加分（不含基準新面向）− A 缺項扣分 − D 幻覺扣分，限制 0～100
組 4D 分數（0～100）＝ 組員個人 4D 的平均；個人 4D 四個維度各最高 25 分；盡-1 觸發時，被點名那位組員的盡責 −5（最低 0）

解方排名分數 ＝ 各回合解方分數的平均；最終 ＝ ＋ 老師解方調整（−10～+10）
4D 排名分數  ＝ 各回合組 4D 分數的平均；最終 ＝ ＋ 老師 4D 調整（−10～+10）
（兩個排名分開，不相加、不設綜合排名；提早結束整場時只計已完成評分的回合）
```

### 6.3 取得資料

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/competitions/:competitionId/results` | 評分作業頁的隊伍清單與整體狀態 | `stage`、`teams[{id,name,members[],solution{rankScore,adjustment},fourD{rankScore,adjustment},flagCount}]`；名次在 `stage = 1` 之後才回傳 |
| GET | `/competitions/:competitionId/results/teams/:teamId` | 單一隊的評分明細（點隊伍後） | 見下 |
| GET | `/competitions/:competitionId/results/ranking` | 最終排名表、頒獎台（解方、4D 兩個） | `stage = 1` 之後才可取；`{ solution: [{rank,teamId,teamName,members[],rankScore,adjustment,finalScore}], fourD: [同上] }` |
| GET | `/competitions/:competitionId/results/fourd-overview` | 4D 三個層級 | 全班平均、各組平均、每位學生個人分數（每一層都有 `D1`～`D4` 與 `total`） |
| GET | `/competitions/:competitionId/results/final-knowledge-map` | 集體知識地圖（賽後版） | 見 6.5（以每隊最後一回合的最終回答為準） |
| GET | `/competitions/:competitionId/rounds/:roundNumber/suggestions` | 各回合改善建議（取代原本的賽後亮點與下堂課建議） | 見 5.7 |

單一隊評分明細：

```json
{
  "id": "A", "name": "A 隊", "members": ["劉亭慧", "劉曉慧", "劉惠"],
  "scores": {
    "solution": { "rankScore": 48.8, "adjustment": 0, "finalScore": 48.8 },
    "fourD":    { "rankScore": 69.0, "adjustment": 0, "finalScore": 69.0 }
  },
  "rounds": [
    {
      "number": 1,
      "finalAnswer": { "studentName": "劉曉慧", "summary": "先更換供應商，但…", "fullText": "這一回合組內投票選出的完整解方全文", "votes": 2, "totalVotes": 3 },
      "solution": { "aPenalty": 0, "b": 30, "c": 0, "d": 0, "total": 30 },
      "fourD": {
        "members": [{ "studentName": "劉亭慧", "D1": 18, "D2": 20, "D3": 16, "D4": 14, "total": 68, "privacyHit": false,
                      "comments": { "D1": "…", "D2": "…", "D3": "…", "D4": "…" } }],
        "group": { "D1": 17, "D2": 19, "D3": 15, "D4": 13, "total": 64 },
        "uncertain": [{ "studentName": "劉尹慧", "indicator": "委-3", "evidence": "第 3、5 則對話", "reason": "…" }]
      },
      "stance":   { "ok": true, "quote": "…" },
      "measures": { "ok": true, "quote": "…" },
      "coverage": [{ "dim": "財務影響量化", "level": 1, "baselineLevel": 1, "beyondBaseline": false, "uncertain": false, "quote": "…" }],
      "bonusDims": [{ "dim": "消費者輿情監測", "reason": "…", "active": true }],
      "flags": [{ "type": "明確錯誤｜前後矛盾｜疑似錯誤｜無法確認", "text": "…", "reason": "…", "penalty": 5, "active": true, "uncertain": false, "dim": "替代方案比較" }],
      "privacy": [{ "studentName": "劉昕慧", "text": "對話中貼了同學的手機號碼", "reason": "這位同學的盡責維度 −5 分" }],
      "aiComment": "…"
    }
  ],
  "peerComments": [{ "fromTeamId": "B", "fromTeamName": "B 隊", "comment": "…" }],
  "teacherNote": "…"
}
```

- 互評是**純文字留言，不計分**（對應資料庫 `PeerComment`）。
- `finalAnswer` 只回得票最高的那一份（含完整解方 `fullText`，教師端在評分作業最上方顯示給老師對照 AI 的評分），且是匿名投票，不回投票者身分。
- 4D 是**每位組員各評一次**（四個維度各 0～25），`group` ＝ 組員個人的平均；盡-1 只扣被點名那位組員的盡責 −5（最低 0）；每位組員每個維度各有一段評語（`members[].comments`）；評分 AI 在兩個分數之間猶豫的 4D 指標放在 `uncertain`。
- `stance`／`measures`：A 基本要求的門檻判斷；`ok: false` 時各扣 10，記在 `solution.aPenalty`。
- `coverage[].baselineLevel`：題庫基準答案的等級；`beyondBaseline` ＝ `level > baselineLevel`，由後端計算，畫面標示「基本提問就有／超出基本提問」。
- `bonusDims` 不含基準新面向。
- 「評分 AI 的標記」前端由 `coverage[].uncertain`、`flags`、`privacy`、`fourD.uncertain`、A 缺項整理出來，**優先列在老師評分之前**供參考；分成解方類與 4D 類。
- 其中「疑似錯誤」「無法確認」標記為待查證、不加分也不扣分；「明確錯誤」「前後矛盾」各扣 5 分；盡-1 扣盡責維度 5 分。

### 6.4 老師的動作

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| PUT | `/competitions/:competitionId/results/teams/:teamId/teacher-review` | 儲存這一隊的老師評分 | 送 `solutionAdjustment`、`fourDAdjustment`（各為整數，−10～+10，預設 0）、`teacherNote`（評語，選填）；評語可以空白，有寫才顯示在「老師評價」；公布後回 409；資料表要存兩個調整值（欄位名稱待競賽後端確認）與 `teacher_comment` |
| POST | `/competitions/:competitionId/results/confirm` | 「確認評分」 | 計算兩個最終排名並公布（`stage = 1`）；不檢查評語 |
| POST | `/competitions/:competitionId/results/skip` | 「跳過評分」 | 所有隊伍兩個調整都歸零，直接計算兩個最終排名並公布（`stage = 1`） |

系統要保留 AI 原始分數、老師調整分數與評語（沒寫就存空白）。

### 6.5 賽後集體知識地圖

`GET /competitions/:competitionId/results/final-knowledge-map`

```json
{
  "rows": [
    { "dim": "財務影響量化", "origin": "official",
      "cells": { "A": { "level": 2, "excluded": null }, "D": { "level": 0, "excluded": "該產業平均違規率達 42%" } },
      "covered": ["A","B","C"], "solid": ["A"] }
  ]
}
```

- 由**評分 AI** 每回合評分時一併產出，不另外呼叫（`docs/scoring-design.md` 十一「完整版」）；以這一版為準，可能跟即時版不同。
- 每隊每個面向取**各回合中最高**的涵蓋程度（`level` 0／1／2）；沒有超出基準等級的標示「基本提問就有」（`cells[].basic: true`）。
- 評分 AI 確認的新面向（C 加分）列為 `origin: team`；即時版出現過、但評分 AI 沒有確認的新面向，不列入。
- 被確認為幻覺而扣分的面向，該隊不計（`level: 0`，`excluded` 寫原因）。

### 6.6 賽後亮點與下堂課建議（已取消）

改成每回合的「本回合改善建議」（見 5.7），由競賽評分 AI 以學生使用 4D 的狀況為主產生；最後一回合是整場的 4D 總結。

---

## 7. 即時推播（WebSocket／SSE）

監控台、隊伍詳情需要即時資料。建議連線：`/ws/competitions/:competitionId`（老師端）。

| 事件 | 內容 | 前端怎麼用 |
|---|---|---|
| `clock.changed` | `endsAt`、`paused` | 暫停、恢復、加時時更新倒數 |
| `round.changed` | `number`、`total`、`phase` | 回合切換：進行中 → 匿名投票（約 1 分鐘）→ 評分 AI 評分 → 改善建議 → 回合結束／所有回合結束 |
| `team.updated` | 單一隊的 `teams[]` 欄位（狀態、已提交人數、覆蓋率、旗標；沒有 AI 分數） | 更新隊伍卡片與「需要你注意」 |
| `event.created` | 一則即時動態 | 加進即時動態，並跳動畫 |
| `knowledgeMap.updated` | 某個面向新增了哪隊、哪位同學的摘要（面向偵測 AI，每隊每 1～2 分鐘一批） | 心智圖長出新分支 |
| `message.created` | 隊伍詳情的新對話（只推給正在看該隊的老師） | 對話紀錄即時增加 |
| `suggestions.ready` | `round` | 本回合改善建議產生完成，監控台跳出建議 |
| `competition.ended` | — | 提示可以前往評分 |

如果第一版先不用 WebSocket，可以退而求其次用輪詢：每 3～5 秒打一次 `GET /competitions/:id/live`，前端畫面不需要改。

## 8. 前端畫面 ↔ API 對照

| 畫面 | 用到的 API |
|---|---|
| 登入／設定 | 第 1 節 |
| 首頁 | `GET /me`、`GET /courses` |
| 側邊欄 | `GET /courses`、`GET /bank/categories` |
| 課程詳情 | `GET /courses/:id`、`/students`、`/competitions` |
| 發起競賽視窗 | `GET /bank/categories`、`GET /bank/cases`、`POST /courses/:id/competitions`、`POST …/start` |
| 題庫管理 | 第 3 節（含 `POST …/baseline` 重新產生基準答案） |
| 監控台 | `GET …/live`、`…/knowledge-map`、`…/events`、`…/rounds/:n/suggestions`、pause／resume／extend／end／hints、WebSocket |
| 隊伍詳情 | `GET …/teams/:teamId`、`POST …/hints` |
| 評分作業 | `GET …/results`、`GET …/results/teams/:teamId`、`PUT …/teacher-review`、`POST …/confirm`、`POST …/skip` |
| 集體知識地圖（賽後） | `GET …/results/final-knowledge-map` |
| 總覽 | `GET …/results/ranking`、`…/results/fourd-overview`、`…/rounds/:n/suggestions` |

## 9. 還沒定案、需要討論的事

已定案、從清單移除的：老師評分（解方、4D 分開各 ±10、評語選填、可跳過，見第 6 節）、解方與 4D 分開排名、互評只留言不計分（見 6.2、6.3）、
回合數與時間（見第 4 節）、排程發布與其他說明（見第 4 節）、知識地圖 `answers` 由面向偵測 AI 產生（見 5.3）、
提早結束整場只計已完成評分的回合（見 5.2）、賽後亮點與下堂課建議改成每回合改善建議（見 5.7）、
回合由老師按「開始第 N 回合」推進（見 5.2）。

1. **自訂分類**是每位老師各自一份，還是全站共用？
2. **題庫欄位名稱與型別**：3.1 已照評分規格列出（議題、背景、任務、利害關係人、主要面向、基準答案，不設幻覺陷阱），名稱與型別待競賽後端確認（Issue #49）。
3. **投票與評分、改善建議的實際耗時**：由後端決定（前端先示意投票 1 分鐘）。
