# 學生端 API（競賽）

這份文件定義學生端競賽流程需要的 API，給前端（學生端）與後端在開發前先對好。
依據：資料庫 migration `backend/migrations/001`、`002`，以及學生端 demo（`frontend/src/pages/student/`）
與 `docs/system-flow.md` 五「競賽中」。

> 狀態：**草稿（2026-11-23）**，待學生端前端確認後定案。有不同意見請直接在這份文件上提出或修改。
> 教師端的 API 在 `docs/api-teacher.md`（改版前的舊版，之後另外更新）。

---

## 0. 通用約定

| 項目 | 約定 |
|---|---|
| 路徑前綴 | `/api/v1`，以下路徑都省略前綴。學生端 API 都在 `/student` 底下 |
| 格式 | JSON、UTF-8；欄位用 camelCase（跟 `api-teacher.md` 一致） |
| ID | 數字（資料庫自動編號） |
| 時間 | ISO 8601（UTC），例如 `2026-11-23T08:30:00Z` |
| 階段 | `stage`：`1`＝原因、`2`＝解方。競賽的 `currentStage`：`0`＝還沒開始、`1`、`2` |
| 錯誤格式 | HTTP 狀態碼 ＋ `{ "error": { "code": "STAGE_NOT_OPEN", "message": "這個階段還沒開放" } }`，錯誤碼列在第 9 節 |

### 通行碼（學生不用登入）

- 學生用賽場代碼＋名字加入（第 1 節）時，後端回傳一組 **通行碼 `token`**（64 字元亂碼，存在 `student.token`）。
- 前端把 `token` 存在瀏覽器（`sessionStorage` 或 `localStorage`），之後**除了加入以外的每一支 API**都要在 header 帶：

  ```
  Authorization: Bearer <token>
  ```

- 後端從 `token` 認出是哪個學生、在哪場競賽，所以路徑裡不需要帶學生 ID 或競賽 ID。
- 沒帶、或對不到任何學生 → `401 INVALID_TOKEN`。前端收到時回到「輸入賽場代碼」畫面。

### 即時更新（輪詢）

先用「前端每隔幾秒問一次」，之後有需要再改成伺服器推送（SSE）。建議間隔：

| 畫面 | 要定時問的 API | 間隔 |
|---|---|---|
| 選擇組別 | `GET /student/groups`、`GET /student/competition`（看老師開始了沒） | 2 秒 |
| 賽場 | `GET /student/competition`（階段有沒有換）、`GET /student/board`、`GET /student/public-answers` | 2 秒 |

---

## 1. 加入競賽

`POST /student/join`　（不用帶通行碼）

送：

```json
{ "code": "A1B2C3", "name": "王小明" }
```

| 欄位 | 規則 |
|---|---|
| `code` | 必填，賽場代碼（6 碼），不分大小寫 |
| `name` | 必填，去掉前後空白後 1～20 字 |

回 `201`：

```json
{
  "studentId": 12,
  "name": "王小明",
  "groupId": null,
  "competitionId": 3,
  "token": "9f2c…（64 字元）"
}
```

錯誤：`400 VALIDATION_ERROR`、`404 COMPETITION_NOT_FOUND`（代碼不存在）

資料表：讀 `competition`；新增一筆 `student`（`group_id` 空的、產生 `token`）

---

## 2. 我的資料

`GET /student/me`

用途：重新整理頁面後，用存著的 `token` 找回自己的狀態（在哪場、哪一組）。

回 `200`：

```json
{ "studentId": 12, "name": "王小明", "groupId": 2, "competitionId": 3 }
```

資料表：`student`

---

## 3. 選擇組別

### 3.1 各組名單

`GET /student/groups`

回 `200`：組別數是老師發起競賽時設定的（`competition.grp_num`），沒人的組也會列出來。

```json
{
  "groupCount": 4,
  "groups": [
    { "groupId": 1, "members": [ { "studentId": 12, "name": "王小明" }, { "studentId": 15, "name": "林小美" } ] },
    { "groupId": 2, "members": [] },
    { "groupId": 3, "members": [ { "studentId": 13, "name": "陳大文" } ] },
    { "groupId": 4, "members": [] }
  ]
}
```

資料表：`competition`、`student`

### 3.2 加入／換組／離開

`PUT /student/group`

送（加入或換到第 2 組）：

```json
{ "groupId": 2 }
```

送（離開這組）：

```json
{ "groupId": null }
```

| 規則 | 錯誤 |
|---|---|
| `groupId` 是 1～組別數的整數，或 `null` | `400 GROUP_OUT_OF_RANGE` |
| 競賽開始前（`status` = `waiting`）可以自由加入、換組、離開 | — |
| 競賽開始後：**還沒有組的人**（例如遲到）可以選一次組；**已經有組的人**不能再換或離開 | `409 COMPETITION_STARTED` |
| 每組沒有人數上限 | — |

回 `200`：跟 `GET /student/me` 一樣的格式。

資料表：更新 `student.group_id`

---

## 4. 賽場資訊

`GET /student/competition`

回 `200`：

```json
{
  "competitionId": 3,
  "code": "A1B2C3",
  "topic": "供應鏈勞動爭議",
  "content": "「安心生活」是台灣中大型電商平台……",
  "groupCount": 4,
  "stageMinutes": 10,
  "currentStage": 1,
  "status": "running",
  "stageEndsAt": "2026-11-23T08:40:00Z",
  "remainingSec": null,
  "serverTime": "2026-11-23T08:33:00Z",
  "stages": [
    { "stage": 1, "type": "原因", "boardSize": 6 },
    { "stage": 2, "type": "解方", "boardSize": 4 }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `stageMinutes` | 每個階段的時限（分鐘），`competition.time` |
| `currentStage` | 老師目前開放到哪個階段（0＝還沒開始、1＝原因、2＝解方）；前端用它決定哪些階段鎖住 |
| `status` | `waiting` 等開始、`running` 進行中、`paused` 暫停、`ended` 結束（前端跳結果頁） |
| `stageEndsAt` | 這個階段幾點結束（全班共用）。前端倒數＝`stageEndsAt` − 現在，所以遲到的人剩得比較少。還沒開始＝`null` |
| `remainingSec` | 暫停時還剩幾秒，倒數停在這個數字；沒暫停＝`null`。暫停後要老師手動按繼續 |
| `serverTime` | 伺服器現在的時間。學生電腦的時鐘可能不準，建議前端用「`stageEndsAt` − `serverTime`」算剩幾秒，再自己往下數 |
| `boardSize` | 這個階段的基本答案板有幾格（**不含答案內容**，答案要亮起來才看得到，見第 7 節） |

資料表：`competition`（含 003 的 `status`、`stage_ends_at`、`remaining_sec`）、`issue`、`question`、`basic_ans`（只算數量）

---

## 5. 跟 AI 對話

每個學生在每個階段各有一個自己的對話。

### 5.1 對話紀錄

`GET /student/messages?stage=1`

回 `200`：由舊到新

```json
{
  "stage": 1,
  "messages": [
    { "messageId": 101, "role": "student", "content": "這件事可能有哪些原因？", "time": "2026-11-23T08:31:05Z" },
    { "messageId": 102, "role": "ai", "content": "…", "points": ["供應商為了壓成本讓員工超時", "平台沒有稽核供應商"], "time": "2026-11-23T08:31:09Z" }
  ]
}
```

- `role`：`student` 或 `ai`
- `points`：只有 AI 的訊息有，是 AI 回覆拆成的列點，前端每個列點旁邊放勾選框

資料表：`message`

### 5.2 送出訊息

`POST /student/messages`

送：

```json
{ "stage": 1, "content": "這件事可能有哪些原因？" }
```

| 規則 | 錯誤 |
|---|---|
| `content` 去掉前後空白後 1～1000 字 | `400 VALIDATION_ERROR` |
| 要先選好組別 | `409 NO_GROUP` |
| `stage` 必須是目前開放的階段（`currentStage`）；舊階段只能看不能再對話 | `409 STAGE_NOT_OPEN` |
| 競賽要在進行中（`status` = `running`）；暫停、結束時不能對話 | `409 COMPETITION_NOT_RUNNING` |

回 `201`：學生這則＋AI 回覆這則（格式同 5.1）

```json
{
  "studentMessage": { "messageId": 101, "role": "student", "content": "…", "time": "…" },
  "aiMessage": { "messageId": 102, "role": "ai", "content": "…", "points": ["…", "…"], "time": "…" }
}
```

> 第一版先回**固定的假回覆**，等 AI 串好再換成真的；格式不變，前端不用改。
> 4D 評分（`score_4d`）在後端另外做，這支 API 不回傳分數。

資料表：新增兩筆 `message`

---

## 6. 送出答案

`POST /student/answers`

一次送出好幾個勾選的列點。

送：

```json
{ "stage": 1, "contents": ["供應商為了壓成本讓員工超時", "平台沒有稽核供應商", "消費者不在意"] }
```

| 規則 | 錯誤 |
|---|---|
| `contents` 1～10 項，每項 1～500 字 | `400 VALIDATION_ERROR` |
| 要先選好組別 | `409 NO_GROUP` |
| `stage` 必須是目前開放的階段 | `409 STAGE_NOT_OPEN` |
| 競賽要在進行中（`status` = `running`） | `409 COMPETITION_NOT_RUNNING` |

每一項依序判斷：

1. 跟這個階段的基本答案比，對到**自己這組還沒亮的**某一格 → 亮那一格（`basic`）
2. 對到的是**自己這組已經亮過的**格子 → 不計分（`duplicate`），也不進公開搶答區
3. 都沒對到 → 進公開搶答區：如果全班已經有人送過很相似的內容 → 不計分（`duplicate`）；否則搶答成功（`public`）

回 `201`：

```json
{
  "results": [
    { "content": "供應商為了壓成本讓員工超時", "result": "basic", "boardIndex": 0, "score": 0.5 },
    { "content": "平台沒有稽核供應商", "result": "basic", "boardIndex": 2, "score": 0.5 },
    { "content": "消費者不在意", "result": "public", "score": 1 }
  ],
  "summary": { "basicCount": 2, "publicCount": 1, "duplicateCount": 0, "totalScore": 2 }
}
```

- `boardIndex`：亮的是第幾格（從 0 開始，跟第 7 節的 `index` 對應）
- 分數（評分規格，2026-11-26 確認）：
  - 對到基本答案、這組第一次答到：**0.5 分**；這組已經答過：0 分
  - 全新的答案、第一個提出：**1 分**；別人已經提過：0 分

> 第一版的「像不像」先用簡單的文字比對（跟學生端 demo 一樣），之後換成 AI 判斷；格式不變。

資料表：每一項新增一筆 `stu_ans`（`basic` 填 `basic_ans_id`；`public`／`duplicate` 的 `basic_ans_id` 是空的）

---

## 7. 我們這組的答案板

`GET /student/board?stage=1`

回 `200`：只會回自己這組的狀態，看不到別組亮了哪幾格。

```json
{
  "stage": 1,
  "boardSize": 6,
  "cells": [
    { "index": 0, "revealed": true, "content": "供應商為壓低成本而讓員工超時工作", "byName": "王小明" },
    { "index": 1, "revealed": false },
    { "index": 2, "revealed": true, "content": "平台對供應商缺乏勞動條件稽核", "byName": "林小美" },
    { "index": 3, "revealed": false },
    { "index": 4, "revealed": false },
    { "index": 5, "revealed": false }
  ]
}
```

- 還沒亮的格子**不回傳內容**，避免從網路請求偷看答案
- `byName`：這組裡第一個答到的人

錯誤：還沒選組 → `409 NO_GROUP`；`stage` 還沒開放 → `409 STAGE_NOT_OPEN`

資料表：`basic_ans`、`stu_ans`、`student`

---

## 8. 公開搶答區

`GET /student/public-answers?stage=1`

回 `200`：全班都看得到，依送出時間由舊到新。只列搶答成功的，重複不計分的不列。

```json
{
  "stage": 1,
  "answers": [
    { "answerId": 201, "groupId": 3, "studentName": "陳大文", "content": "媒體報導讓問題被放大", "score": 1, "time": "2026-11-23T08:35:12Z" }
  ]
}
```

錯誤：`stage` 還沒開放 → `409 STAGE_NOT_OPEN`

資料表：`stu_ans`（`basic_ans_id` 空的、`score` > 0）、`student`

---

## 9. 錯誤碼

| HTTP | code | 什麼時候 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 欄位缺少、格式或長度不對 |
| 400 | `GROUP_OUT_OF_RANGE` | 組別號碼小於 1 或超過組別數 |
| 401 | `INVALID_TOKEN` | 沒帶通行碼或通行碼不對 |
| 404 | `COMPETITION_NOT_FOUND` | 賽場代碼不存在 |
| 409 | `COMPETITION_STARTED` | 競賽已經開始，已經有組的人不能換組 |
| 409 | `COMPETITION_NOT_RUNNING` | 競賽還沒開始、暫停或已結束，不能對話、送答案 |
| 409 | `NO_GROUP` | 還沒選組就想對話、送答案、看答案板 |
| 409 | `STAGE_NOT_OPEN` | 階段還沒開放，或已經不是目前的階段（不能再對話、送答案） |
| 500 | `INTERNAL_ERROR` | 後端出錯 |

---

## 10. 已決定（2026-11-23）

- **同名學生**：允許。前端在自己的名字旁邊標「（你）」（用 `studentId` 比對）；加入時如果撞名，
  前端可以提醒「這場已經有人叫○○，要不要加個座號？」，學生可以不改
- **競賽開始後可以加入**；還沒有組的人可以選一次組（見 3.2）
- **倒數計時**：`competition` 記這個階段幾點結束，全班共用（migration `003`，見第 4 節）

## 11. 待確認

- **分數**：基本答案、搶答的分數等評分規格（亭慧）定案。
- **結果頁**的 API 之後再補。
