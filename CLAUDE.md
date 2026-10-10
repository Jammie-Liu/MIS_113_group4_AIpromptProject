# CLAUDE.md

這份檔案給所有組員與各自的 AI 助理（Claude Code 等）在這個 repo 工作前先讀。內容只放
**團隊已經確定的規則**；還在討論、尚未定案的規則（例如命名慣例、後端技術棧、AI 協作細節）
由各自負責人跟組員討論中，定案後才會補進這份檔案。

## 每次開工前

- 先讀 [docs/CHANGELOG.md](docs/CHANGELOG.md) 最上面（最新）幾則紀錄，了解目前專案進度。
- 再讀 [docs/architecture.md](docs/architecture.md) 確認資料夾／模組規劃。
- **修改前都要先閱讀 [docs/system-flow.md](docs/system-flow.md)（系統主線流程）**，確認這次的
  改動跟流程沒有衝突；如果要新增或修改功能，也要同步修改這份流程文件。

## 每次改動後

- 在 [docs/CHANGELOG.md](docs/CHANGELOG.md) **最上面**新增一則紀錄（格式見該檔案），
  舊紀錄不要刪除或覆蓋。
- 如果動到後端共用模組（題庫、提交、評分），要額外知會該模組的共同負責人。

## 開發優先順序

1. **登入／角色／權限系統最優先完成**——競賽模式依賴使用者身份，是其他功能的前提。
2. 前後端先訂好 **API 規格**，再各自平行開發，不是各寫各的最後才對接。
3. 後端共用模組（題庫、提交、評分）要指定專屬負責人。

## Git 規則（GitHub Flow）

- `main` 分支保護，不直接 push 一般開發改動；改動一律開分支、發 PR，且 PR 要小而單一。
- **PR 依影響範圍決定要不要 review**（範圍見下方「負責範圍」）：
  - **只動到自己範圍內的檔案**：可以自己 merge，不用等別人 review。
  - **會影響到其他人**：要請受影響的人 review 過才能 merge。包括：
    - 動到「共用檔案」或別人範圍內的檔案（就算只改一行）
    - 改動會讓別人的程式或文件要跟著改，例如 API 回傳格式、資料表欄位、共用元件的用法
  - 判斷不出來時，一律當作會影響其他人。
  - 在 `docs/CHANGELOG.md` 最上面新增自己的紀錄不算影響其他人。
- **每次要 push 到 `main` 之前，先 `git pull origin main` 拉最新的**，確認自己本機是最新狀態
  再 push，避免推上去才發現落後、或蓋掉別人剛推的東西。
- 用 GitHub Issues + Projects 看板 + Milestones 管理任務。
- 機密資訊（API 金鑰、密碼等）一律放 `.env`，不 commit 進 repo。

## 負責範圍

| 成員 | 角色 | 自己範圍內的檔案 |
|---|---|---|
| 亭慧 | PM | 功能清單、階段分工（Google Sheet）、`docs/scoring-design.md` |
| 芊穎 | 學生端介面 | `frontend/src/pages/student/`、`frontend/src/prototypes/學生端/` |
| 苡瑄 | 教師端介面 | `frontend/src/pages/teacher/`、`frontend/src/prototypes/教師端_*` |
| 筠靈 | 教學後端 | 教學面（練習題）後端程式、`docs/todo-backend.md` |
| 芷琳 | 競賽後端 | 競賽面後端程式、競賽流程文件（Google 文件） |

**共用檔案**（改動一律要請相關的人 review）：

- 規則與說明：`CLAUDE.md`、`README.md`、`docs/architecture.md`
- 主線流程：`docs/system-flow.md`（改到跨角色的流程時）
- 介面約定：`docs/api-draft.md`、資料表／ERD、後端共用模組（題庫、提交、評分）、`docs/4d-behaviors.md`
- 前端共用：`frontend/src/style.css`、`frontend/src/components/`、`frontend/src/App.jsx`、
  `frontend/src/main.jsx`、`frontend/package.json`（含 `package-lock.json`）、`frontend/vite.config.js`
- 專案設定：`.gitignore`、`.claude/`、`.vscode/`

## AI 協作規則

- AI 可以輔助寫程式碼、輔助 code review，但最終要經過人工審核才能合併。自己範圍內的 PR，
  由自己確認後按 merge；AI 不要自行 merge，除非組員明確要求。
- 每個人都要能解釋自己負責那部分的程式碼邏輯（口試準備），請 AI 協助時，
  複雜邏輯要請它一併說明「為什麼這樣寫」，不是只拿一段能動但看不懂的程式碼。
- 機密資訊（API 金鑰、密碼、`.env` 內容）不要貼給 AI。

## 技術棧（隨專案進展持續更新）

- Frontend：Vite + React，結構見 `frontend/src/{pages,components,api,assets}`。
- Backend：尚未定案，討論中，定案後補上框架、資料庫等選擇。
