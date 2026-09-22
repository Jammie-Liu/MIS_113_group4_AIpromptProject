# CLAUDE.md

這份檔案給所有組員與各自的 AI 助理（Claude Code 等）在這個 repo 工作前先讀。內容只放
**團隊已經確定的規則**；還在討論、尚未定案的規則（例如命名慣例、後端技術棧、AI 協作細節）
由各自負責人跟組員討論中，定案後才會補進這份檔案。

## 每次開工前

- 先讀 [docs/CHANGELOG.md](docs/CHANGELOG.md) 最上面（最新）幾則紀錄，了解目前專案進度。
- 再讀 [docs/architecture.md](docs/architecture.md) 確認資料夾／模組規劃。

## 每次改動後

- 在 [docs/CHANGELOG.md](docs/CHANGELOG.md) **最上面**新增一則紀錄（格式見該檔案），
  舊紀錄不要刪除或覆蓋。
- 如果動到後端共用模組（題庫、提交、評分），要額外知會該模組的共同負責人。

## 開發優先順序

1. **登入／角色／權限系統最優先完成**——競賽模式依賴使用者身份，是其他功能的前提。
2. 前後端先訂好 **API 規格**，再各自平行開發，不是各寫各的最後才對接。
3. 後端共用模組（題庫、提交、評分）要指定專屬負責人。

## Git 規則（GitHub Flow）

- `main` 分支保護，不直接 push 一般開發改動；改動一律開 PR，且 PR 要小而單一。
- 每個 PR 需要至少一人 review 過才能合併。
- 用 GitHub Issues + Projects 看板 + Milestones 管理任務。
- 機密資訊（API 金鑰、密碼等）一律放 `.env`，不 commit 進 repo。

## AI 協作規則

- AI 可以輔助寫程式碼、輔助 code review，但最終要經過人工審核才能合併。
- 每個人都要能解釋自己負責那部分的程式碼邏輯（口試準備），請 AI 協助時，
  複雜邏輯要請它一併說明「為什麼這樣寫」，不是只拿一段能動但看不懂的程式碼。
- 機密資訊（API 金鑰、密碼、`.env` 內容）不要貼給 AI。

## 技術棧（隨專案進展持續更新）

- Frontend：Vite + React，結構見 `frontend/src/{pages,components,api,assets}`。
- Backend：尚未定案，討論中，定案後補上框架、資料庫等選擇。
