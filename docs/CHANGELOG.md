# 修改紀錄（給人也給 AI 看）

這份檔案記錄每次對這個 repo 做的重大修改。目的是讓組員（不論是自己看，還是丟給
自己的 AI 助理／Claude／ChatGPT 看）都能在不用重新翻整個 git log 的情況下，
快速知道：**目前專案進度到哪、上一個人改了什麼、接下來還缺什麼**。

## 給 AI 助理的使用說明

如果你是被組員叫來處理這個專案的 AI：
1. 先讀這份檔案最上面（最新）的紀錄，了解目前狀態與「待辦事項」。
2. 再讀 [architecture.md](architecture.md) 了解整體規劃的資料夾結構。
3. 動手改動之後，**請在這份檔案最上面新增一則紀錄**（格式見下方「紀錄格式」），
   不要覆蓋或刪除舊紀錄。
4. 如果你的改動讓某一則舊紀錄的「待辦事項」變成已完成，可以在新紀錄裡註明
   「已完成上一則的 XXX」，但不要回頭去改舊紀錄本身。

## 紀錄格式

新增紀錄時，複製以下格式貼在最上面（「## 修改紀錄」標題下方、最新的一則之上）：

```
### YYYY-MM-DD · 你的名字/帳號
**做了什麼：**
- ...

**為什麼：**
- ...

**怎麼跑起來 / 怎麼驗證：**
- ...

**還沒做完 / 下一步：**
- ...
```

---

## 修改紀錄

### 2026-09-23 · Claude Code（協助學生端 frontend 負責人）

**做了什麼：**
- 把 `frontend/src/prototypes/學生端_最初版.html`（HTML/CSS/JS 全部寫在同一個檔案）
  拆成三個檔案：`frontend/src/prototypes/學生端/{index.html, style.css, script.js}`，
  舊的單一檔案已刪除。
- 側邊導覽列改成 `position:fixed` 固定不隨頁面捲動；新增可以把整條側邊欄完全收合、
  從畫面消失的功能，並在左上角加一個漢堡選單圖示，點擊後可以展開恢復。
- 頂部固定列的 4D 分數標籤從 `D1`/`D2`/`D3`/`D4` 改成中文「委託／描述／辨識／審慎」。
- 修正賽場代碼輸入框的 bug：原本每次打開會殘留上一次輸入的內容，現在每次開啟前都會
  清空。
- 加入賽場後，側邊欄與頂部列會整個隱藏、畫面變成競賽全螢幕；右下角的吉祥物按鈕文字
  同步從「賽場入口」變成「賽場出口」，點擊可離開競賽並恢復側邊欄／頂部列。
- 移除「競賽紀錄」畫面裡重複的標題／說明面板，只保留最上方固定列的標題，避免同樣的
  文字顯示兩次。

**為什麼：**
- 學生端負責人要求先把原型拆成三個檔案方便維護，並且要有一版畫面可以直接展示給老師
  確認 UI/UX，此階段先不接框架、不串 API。

**怎麼跑起來 / 怎麼驗證：**
- 直接用瀏覽器打開 `frontend/src/prototypes/學生端/index.html` 即可（純靜態頁面，
  不需要 `npm install`／`npm run dev`）。
- 已用 Playwright 實際開瀏覽器逐項驗證：側邊欄收合／展開、賽場代碼輸入框重置、
  進出賽場時側邊欄與頂部列的顯示切換、競賽紀錄頁不再重複顯示標題，並截圖確認畫面
  正確無誤，主控台沒有錯誤訊息。

**還沒做完 / 下一步：**
- 這份還是純 HTML 原型，尚未轉成 `frontend/src/pages/student/` 底下的 React 元件
  （團隊另一則紀錄提到 `StudentHome.jsx` 已經是第一個範例元件，其餘畫面含這次修改的
  部分還沒有轉換）。
- 尚未接 API、尚未接框架路由，仍是展示用的靜態頁面。

### 2026-09-22 · hsuyunling33

**做了什麼：**
- 把 `frontend/` 從空殼（只有一個空的 `package.json`）初始化成一個真的可以跑的
  **Vite + React** 專案（原本有考慮 Vue，最後組員決定用 React）。
- 依照 [architecture.md](architecture.md) 原本的規劃，建立好資料夾骨架：
  - `frontend/src/pages/student/`、`frontend/src/pages/teacher/`（放各畫面元件）
  - `frontend/src/components/`（放共用元件，例如之後的側邊欄、頁籤）
  - `frontend/src/api/`（之後放呼叫 backend 的程式碼）
  - `frontend/src/assets/`（圖片、字型等靜態資源）
- 把原本寫死在 `frontend/src/prototypes/學生端_最初版.html` 裡的「首頁 / 遊戲任務地圖」
  畫面，轉成第一個範例元件 `frontend/src/pages/student/StudentHome.jsx`，示範怎麼把
  「複製貼上 6 段幾乎一樣的 HTML」改成「一份資料 + `.map()` 畫出來」。
- `frontend/src/prototypes/` 底下兩份原型 HTML（學生端、教師端）**完全保留沒有刪除**，
  之後轉換其他畫面時可以對照著看設計稿與原本的 JS 邏輯。
- 全域顏色變數（`--ink`、`--d1`~`--d4` 等）搬到 `frontend/src/style.css`，之後新畫面
  共用同一套色票，不用每個元件自己重複定義。

**為什麼：**
- 原本兩份 HTML 原型是單一長檔案、UI 邏輯手寫 DOM 操作，沒有元件化、沒有共用邏輯，
  重複程式碼很多（例如學生端跟教師端的 mascot、accordion、頁籤切換邏輯幾乎一樣）。
- 要往「可以真的接後端、可以多人協作分工」的正式專案前進，需要先有一個現代前端框架
  的骨架。

**怎麼跑起來 / 怎麼驗證：**
```bash
cd frontend
npm install     # 第一次 clone 下來，或每次 package.json 有變動時都要跑
npm run dev     # 啟動本地開發伺服器，瀏覽器打開它印出來的網址（預設 http://localhost:5173）
```
- 已實際跑起來用瀏覽器截圖確認過，畫面（6 個關卡節點、連續練習卡片、競賽 CTA 按鈕）
  跟原本的 HTML 原型一致。

**還沒做完 / 下一步：**
- 目前 `App.jsx` 只掛了 `StudentHome` 一個畫面，**還沒有接路由**（react-router-dom），
  所以現在還沒辦法用網址切換到其他畫面。下一步可以裝 `react-router-dom`，把兩份原型
  裡剩下的畫面（題庫、關卡練習、競賽進行中、競賽結果、競賽紀錄、個人資料、設定、
  教師端全部畫面）一個一個轉成元件並接上路由。
- 側邊欄、頁籤（tabs）、彈窗（modal）這幾個在學生端/教師端重複出現的 UI，還沒有抽成
  `frontend/src/components/` 底下的共用元件，目前每個原型還是各自寫一份。
- `backend/` 目前還是完全空的（只有一個空的 `index.js`），`architecture.md` 規劃的
  `Controllers/`、`Models/`、`Services/`、`Routes/`、`Middleware/` 都還沒建立，
  之後前端要接真正的資料需要這部分先動工。
- `README.md` 補了基本說明，但還可以再補更完整的專案簡介。

**組員注意事項：**
- 如果你的電腦還沒裝 Node.js，先去 https://nodejs.org 裝 LTS 版本（會順便裝好 npm）。
- `frontend/node_modules/` 資料夾不會、也不應該進 git（已經在 `.gitignore` 裡排除），
  每個人 clone 下來自己跑一次 `npm install` 就好。
