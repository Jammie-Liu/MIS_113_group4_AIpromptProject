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
| 列舉值 | 難度 `bronze｜silver｜gold｜diamond`（畫面顯示青銅／白銀／黃金／鑽石）；題庫公開狀態 `public｜private`；隊伍狀態 `discussing｜submitted｜stalled｜graded` |
| 即時更新 | 監控台需要即時資料，建議用 WebSocket（或 SSE），見第 5 節 |

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
| GET | `/me/settings` | 取得通知與競賽預設值 | `notifications{stallAlert,hallucinationAlert}`、`competitionDefaults{stallThresholdSeconds}` |
| PATCH | `/me/settings` | 更新上述設定 | 同上（部分欄位即可） |

註：互動音效與音效風格只存在瀏覽器（localStorage），不需要 API。

## 2. 課程（首頁、課程詳情）

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/courses` | 首頁課程卡片、側邊欄的課程清單 | `[{id,term,title,schedule,studentCount,competitionCount,icon}]` |
| GET | `/courses/:courseId` | 課程詳情（課程大綱頁籤） | `id`、`term`、`title`、`schedule`、`studentCount`、`syllabus{intro,objectives[],grading[{item,percent}]}` |
| GET | `/courses/:courseId/students` | 學生名單頁籤 | `[{id,name,department,avgScore,attendance,email}]`；`avgScore` 是該生競賽平均表現 |
| GET | `/courses/:courseId/competitions` | 過往競賽紀錄頁籤 | `[{id,title,date,teamCount,championTeamName,top3[{rank,teamName,members[]}]}]` |

目前教師端沒有「新增／編輯課程」「新增學生」的畫面，所以這份清單先不列；之後要做再補。

## 3. 題庫管理

### 3.1 題庫

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| GET | `/bank/cases` | 題庫清單 | 篩選：`categoryId`（`none` ＝未分類）、`difficulty`、`source`（`system｜teacher`）；回傳摘要欄位（見下） |
| GET | `/bank/cases/:caseId` | 題庫詳情（點開卡片的視窗、監控台的本題題目） | 回傳完整欄位 |
| POST | `/bank/cases` | 新增題庫（老師自建） | 送完整欄位；回傳新題庫 |
| PATCH | `/bank/cases/:caseId` | 修改題庫 | **只有自己建立的**可以改；系統內建回 403 |
| DELETE | `/bank/cases/:caseId` | 刪除題庫 | 同上，只有自己建立的 |

題庫欄位：

| 欄位 | 說明 |
|---|---|
| `id`、`name` | 案例名稱 |
| `difficulty` | 難度（列舉見第 0 節） |
| `categoryId` | 分類；`null` ＝「未分類」 |
| `industry` | 產業（自由填寫的細項，例如「電商／零售」） |
| `background` | 情境背景 |
| `roles` | 角色與立場，字串陣列，一行一位 |
| `informationGap` | 資訊落差／限制 |
| `tension` | 兩難張力（一句話） |
| `checklist` | 完整解方檢查清單，字串陣列（評分 AI 的官方面向來源） |
| `hallucinationTrap` | 已知幻覺陷阱（評分用答案，不給學生看） |
| `questionCount` | 題目數，目前固定 1 |
| `visibility` | `public`（所有教師可用）｜`private`（僅本人） |
| `source` | `system`（系統內建）｜`teacher`（老師建立） |
| `ownerId`、`ownerName` | 建立者 |

清單摘要欄位：`id、name、difficulty、categoryId、industry、visibility、source、ownerName、questionCount、background（前 60 字）`。

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
  "round": { "number": 1, "total": 2, "phase": "playing｜voting｜scoring｜between｜finished", "completed": [] },
  "clock": { "endsAt": "…", "remainingSeconds": 1198, "paused": false },
  "teams": [
    { "id": "A", "name": "A 隊", "color": "#E8636B", "status": "submitted",
      "coveragePercent": 64, "exchangeCount": 6, "aiScore": 79, "hinted": false,
      "flags": [{ "type": "stalled｜hallucination", "text": "超過 90 秒無動作", "tone": "amber｜red" }],
      "stalled": false, "flagged": false }
  ],
  "classFourD": [{ "key": "D1", "label": "委託", "percent": 64 }],
  "knowledgeMap": [ /* 見 5.3 */ ],
  "events": [ /* 最近 40 則，見 5.4 */ ]
}
```

- 「需要你注意」清單前端會自己從 `teams.flags`、`knowledgeMap`（沒人涵蓋的面向）、`classFourD`（低於門檻的面向）組出來，後端不用另外做。
- `stalled` 的判斷（超過 `stallThresholdSeconds` 沒動作）由後端算。

### 5.2 老師的控制動作

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| POST | `/competitions/:competitionId/pause` | 暫停 | 學生端無法送出提示；倒數停止 |
| POST | `/competitions/:competitionId/resume` | 恢復 | — |
| POST | `/competitions/:competitionId/extend` | 加時 | 送 `minutes`（目前按鈕是 +1、+5；隊伍詳情的「節奏調整」建議是 +2）；回新的 `endsAt` |
| POST | `/competitions/:competitionId/rounds/end` | 老師提前結束目前這一回合（不是整場） | 只在 `phase = playing` 可用；直接進入匿名投票階段 |
| POST | `/competitions/:competitionId/rounds/next` | 一回合評分完成後，老師按「開始第 N 回合」 | 只在 `phase = between` 可用；開始下一回合並重設倒數，學生的對話記憶清空；回新的 `round` 與 `endsAt` |
| POST | `/competitions/:competitionId/end` | 結束並評分 | 時間到時也會自動結束；之後進入評分流程 |
| POST | `/competitions/:competitionId/hints` | 推送提示給學生 | 見 5.5 |
| GET | `/hint-cards` | 引導卡範本清單 | `[{key,title,description,text}]`，目前有：換視角引導卡、幻覺警示卡、空白區域卡、節奏調整（監控台的「推送引導卡」只用前三種，節奏調整是隊伍詳情頁的提示建議） |

### 5.3 集體知識地圖（即時）

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/competitions/:competitionId/knowledge-map` | 取得地圖（快照已包含，這支給單獨重抓用） |

```json
[
  { "dim": "財務影響量化", "origin": "official",
    "teams": ["A", "B", "C"],
    "answers": { "A": { "studentId": "…", "studentName": "陳阿哲", "text": "前三個月物流成本約上升 15%…" } } },
  { "dim": "供應商違規紀錄查證", "origin": "team", "teams": ["B", "E"], "answers": { } }
]
```

- `origin`：`official`（題庫檢查清單裡的面向）｜`team`（隊伍自創）。
- `answers`：每隊在這個面向的代表回答（哪位同學說了什麼的摘要），由評分 AI 從對話整理；同一隊同一面向目前只放一位。
- 沒有隊伍涵蓋的面向 `teams` 是空陣列。

### 5.4 即時動態

| 方法 | 路徑 | 用途 |
|---|---|---|
| GET | `/competitions/:competitionId/events?limit=40&before=` | 即時動態清單（點「即時動態」視窗用） |

事件欄位：`id`、`teamName`（或 `全班`）、`kind`（`point` 新面向加分｜`redundant` 重複涵蓋｜`halluc` 幻覺偵測｜`hint` 老師提示）、`text`、`createdAt`。

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
| GET | `/competitions/:competitionId/teams/:teamId` | 隊伍詳情頁（對話紀錄、AI 解方、解方面向） | 見下 |

```json
{
  "id": "A", "name": "A 隊", "status": "submitted",
  "members": [{ "id": "…", "name": "陳阿哲" }],
  "stats": { "exchangeCount": 6, "aiScore": 79, "coveragePercent": 64 },
  "messages": [
    { "studentId": "…", "studentName": "陳阿哲", "at": "02:10", "prompt": "…", "reply": "…",
      "score": 79, "isRepresentative": true, "votes": 3 }
  ],
  "solution": "AI 整合出來的解方全文",
  "coverage": [{ "item": "財務影響量化", "ok": true, "note": "有具體數字（15%）與時間區間" }],
  "hallucination": null
}
```

- `messages`：該隊每位成員與 AI 的完整對話，依時間排序。
- `hallucination`：命中幻覺陷阱時給 `{ text, reason }`，沒有就 `null`。
- 隊伍詳情頁推送提示用 `POST /competitions/:competitionId/hints`（`target:["A"]`）。

## 6. 評分與總覽

這一段是教師端最複雜的流程：老師**覆核 AI 的判斷**，不能直接改總分；總分由後端依公式算出。

### 6.1 流程與狀態

`results.stage`：`0`（覆核中）→ `1`（已公布名次）→ `2`（已公布總分與評語）。

- 每一隊都「確認成績」後，才能公布名次（階段一）。
- 公布名次後，該隊成績不能再解鎖修改。
- 階段二才公布總分、互評與老師評語。
- 總覽（頒獎台、賽後亮點、下堂課建議、最終排名）在全部確認前是鎖定的。

### 6.2 取得資料

| 方法 | 路徑 | 用途 | 主要欄位 |
|---|---|---|---|
| GET | `/competitions/:competitionId/results` | 評分作業頁（隊伍清單）與總覽用的整體狀態 | `stage`、`confirmedCount`、`teamCount`、`teams[{id,name,members[],total,pendingCount,confirmed}]`；名次在階段一之後才回傳 |
| GET | `/competitions/:competitionId/results/teams/:teamId` | 單一隊的評分明細（點隊伍大按鈕後） | 見下 |
| GET | `/competitions/:competitionId/results/ranking` | 最終排名表、頒獎台 | 階段一之後才可取；`[{rank,teamId,teamName,members[],scores{solution,peer,bonus,total,fourDAverage}}]`；階段二之前不回 `peer` 與評語 |
| GET | `/competitions/:competitionId/results/final-knowledge-map` | 集體知識地圖（賽後版） | 見 6.4 |
| GET | `/competitions/:competitionId/results/highlights` | 賽後亮點與下堂課建議 | 見 6.5 |

單一隊評分明細：

```json
{
  "id": "A", "name": "A 隊", "members": ["陳阿哲", "林雅婷", "王品文"],
  "confirmed": false,
  "scores": { "solution": { "a": 20, "b": 35.0, "c": 5, "d": 0, "total": 60.0 }, "peerAverage": 8.5, "bonus": 0, "total": 68.5, "fourDAverage": 68.0 },
  "finalVote": [
    { "studentId": "…", "studentName": "陳阿哲", "summary": "立即終止合約，改由…", "votes": 2 }
  ],
  "peerRatings": [{ "fromTeamId": "B", "fromTeamName": "B 隊", "score": 9, "comment": "稽核機制很具體…" }],
  "stance":   { "ok": true, "quote": "建議立即終止與現供應商的合約" },
  "measures": { "ok": true, "quote": "要求新供應商簽署附帶罰則的勞動條件承諾書…" },
  "coverage": [{ "dim": "財務影響量化", "level": 2, "uncertain": false, "quote": "物流成本上升約 15%，前三個月" }],
  "bonusDims": [{ "dim": "消費者輿情監測", "reason": "官方清單外…", "active": true }],
  "flags": [{ "id": "…", "type": "明確錯誤｜無法確認", "text": "該產業平均違規率達 42%", "reason": "查核後找不到原始來源", "penalty": 5, "active": true, "uncertain": false, "dim": "替代方案比較" }],
  "reviewed": { "cov-執行時程與風險": true, "flag-0": false },
  "fourD": { "D1": 78, "D2": 83, "D3": 70, "D4": 62 },
  "classFourDAverage": { "D1": 64, "D2": 78, "D3": 41, "D4": 29 },
  "aiComment": "立場明確、財務量化具體…",
  "teacherNote": "財務量化清楚…",
  "bonusPoints": 0
}
```

- `finalVote`：**投票是匿名的**，只回得票數（`votes`），不要回「誰投給誰」，教師端也不會顯示投票者。只需要回「得票最高」的那一份即可，落選的答案畫面不顯示；同票時才回全部同票者（同票怎麼決定**待確認**）。
- `coverage[].level`：0 沒提到、1 有提到但只是帶過、2 有具體做法或說明；`uncertain` 是評分 AI 不確定的標記。
- `reviewed`：老師對「需要你確認」項目（AI 不確定的面向、幻覺／待查證標記）標了「已覆核」的狀態，確認成績前必須全部標完。

### 6.3 老師的覆核動作

| 方法 | 路徑 | 用途 | 說明 |
|---|---|---|---|
| PATCH | `/competitions/:competitionId/results/teams/:teamId` | 覆核 AI 判斷 | 送要改的欄位（見下）；回傳**重新計算後**的 `scores`，前端直接顯示 |
| POST | `/competitions/:competitionId/results/teams/:teamId/confirm` | 確認這一隊成績 | 前提：需要確認的項目都已覆核；成功後前端會回到隊伍清單 |
| DELETE | `/competitions/:competitionId/results/teams/:teamId/confirm` | 取消確認（解鎖修改） | 只在階段 `0` 可用，公布名次後回 409 |
| POST | `/competitions/:competitionId/results/publish-ranking` | 公布名次（階段一） | 前提：全部隊伍已確認，否則回 409 |
| POST | `/competitions/:competitionId/results/publish-scores` | 公布總分與評語（階段二） | 前提：已公布名次 |

`PATCH` 可以送的欄位（部分即可）：

```json
{
  "stanceOk": true,
  "measuresOk": true,
  "coverageLevels": { "財務影響量化": 2, "執行時程與風險": 1 },
  "bonusDims": { "消費者輿情監測": true },
  "flags": { "<flagId>": false },
  "reviewed": { "cov-執行時程與風險": true },
  "teacherNote": "…",
  "bonusPoints": 3
}
```

- `bonusPoints` 範圍 0～10（會議記錄 1001 提到老師是「加／扣分」，**待確認**是否允許負數）。
- 老師**不能**直接改 `total`。

### 6.4 賽後集體知識地圖

`GET /competitions/:competitionId/results/final-knowledge-map`

```json
{
  "rows": [
    { "dim": "財務影響量化", "origin": "official",
      "cells": { "A": { "level": 2, "excluded": null }, "D": { "level": 0, "excluded": "該產業平均違規率達 42%" } },
      "covered": ["A","B","C"], "solid": ["A"] }
  ],
  "contributions": { "A": 5 }
}
```

- 這張圖要跟著「覆核結果」更新：被確認為幻覺而扣分的面向，該隊不計（`level: 0`，`excluded` 寫原因）。
- 前端目前用 `covered`／`solid` 標出全班漏洞、獨家貢獻、隊伍自創、全班共識，也可以由後端算。

### 6.5 賽後亮點與下堂課建議

`GET /competitions/:competitionId/results/highlights`

```json
{
  "highlights": [{ "key": "prompt", "title": "最佳追問", "teamName": "A 隊", "studentName": "陳阿哲", "quote": "…", "reason": "指定角色、範圍與數量，D2 描述拿到滿分。" }],
  "nextClassSuggestions": [{ "title": "…", "reason": "…" }],
  "kpis": { "averageTotal": 61.3, "highestTotal": 87.0 }
}
```

由評分 AI 從各隊對話與分數自動挑選；階段一公布之後才能取得。

### 6.6 總分公式（給後端實作參考）

沒有權重，直接相加；老師不能改總分，只能覆核 AI 的各項判斷，總分由後端依公式重算。

```
解方分數（0～100）= A 基本要求（20）＋ B 涵蓋面向（70）＋ C 新面向加分 − D 幻覺扣分
  A：立場明確 10 ＋ 有具體配套措施 10
  B：各面向分數（0/1/2）加總 ÷（面向數 × 2）× 70
  C：官方清單外的新面向，每個 +5，最多 +10
  D：確認的幻覺，每個扣題庫設定的分數（目前 5），最多扣 20
總分 = 解方分數 ＋ 各組互評平均（0～10）＋ 老師個別加分（0～10）
```

- 4D 能力（D1 委託、D2 描述、D3 辨識、D4 盡責）只當能力指標顯示，**不計入總分**（待組員確認）。
- 名次依總分高到低；階段二前不公開互評與評語。

---

## 7. 即時推播（WebSocket／SSE）

監控台、隊伍詳情需要即時資料。建議連線：`/ws/competitions/:competitionId`（老師端）。

| 事件 | 內容 | 前端怎麼用 |
|---|---|---|
| `clock.changed` | `endsAt`、`paused` | 暫停、恢復、加時時更新倒數 |
| `round.changed` | `number`、`total`、`phase` | 回合切換：進行中 → 匿名投票（約 1 分鐘）→ 評分 AI 評分 → 回合結束／所有回合結束 |
| `team.updated` | 單一隊的 `teams[]` 欄位（狀態、覆蓋率、AI 分數、旗標） | 更新隊伍卡片與「需要你注意」 |
| `event.created` | 一則即時動態 | 加進即時動態，並跳動畫 |
| `knowledgeMap.updated` | 某個面向新增了哪隊、哪位同學的回答 | 心智圖長出新分支 |
| `message.created` | 隊伍詳情的新對話（只推給正在看該隊的老師） | 對話紀錄即時增加 |
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
| 題庫管理 | 第 3 節 |
| 監控台 | `GET …/live`、`…/knowledge-map`、`…/events`、pause／resume／extend／end／hints、WebSocket |
| 隊伍詳情 | `GET …/teams/:teamId`、`POST …/hints` |
| 評分作業 | `GET …/results`、`GET …/results/teams/:teamId`、`PATCH` 覆核、`POST …/confirm` |
| 集體知識地圖（賽後） | `GET …/results/final-knowledge-map` |
| 總覽 | `POST …/publish-ranking`、`…/publish-scores`、`GET …/ranking`、`…/highlights` |

## 9. 還沒定案、需要討論的事

1. **老師評分**：1001 寫「可選、可跳過、加／扣分」，目前前端是每隊都要確認、個別加分只能 0～10。
2. **4D 要不要算進總分**，以及互評分數範圍（目前假設 0～10）、能不能評自己組。
3. **回合數與時間**：1001 寫「預設二回合、時間預設 20 分鐘可調」，目前前端是固定 1 題、20 分鐘、只能在競賽中加時。
4. **發布時間（排程發布）、其他說明**：1001 有寫，前端還沒做。
5. **自訂分類**是每位老師各自一份，還是全站共用？
6. 知識地圖的 `answers`（每位同學的回答摘要）由誰產生：評分 AI 即時整理，還是學生送出時一併寫入？
7. 老師端目前沒有「新增課程」「新增學生」「分組」的畫面（會議記錄提到老師隨機或手動分組），之後要做的話需要補 API。

10. **回合怎麼推進**：前端目前是「回合時間到 → 組內匿名投票（示意 1 分鐘）→ 評分 AI 評分 → 等老師按『開始下一回合』」，最後一回合評分完顯示「前往評分」。文件沒有寫「下一回合是自動開始還是老師按」，我先做成老師按，需要確認；投票與評分的時間也要由後端決定。
