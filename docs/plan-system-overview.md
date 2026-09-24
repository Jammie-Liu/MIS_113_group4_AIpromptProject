# 系統功能初步規劃書（草案 v0.1）

**性質**：這是「練習題＋系統功能」這塊的初步功能規劃，範圍比 [plan-practice-module.md](plan-practice-module.md)
更廣一點——把登入帳號、課程管理也一併納入盤點，因為這幾塊雖然不是「練習題」本身，
但都是使用者實際會碰到、而且目前沒人明確認領的系統功能。**還是草案**，需要拿去跟
另一位後端（競賽）、管理者對過範圍界線後才算定案。跟其他文件的關係：

- [plan-practice-module.md](plan-practice-module.md)：練習題本身的討論大綱＋to-do list（更細）
- [flow-practice-module.md](flow-practice-module.md)：使用者流程圖
- 這份文件：**五大功能模組的整體盤點**，給團隊會議時對範圍、對優先順序用

只放在 `discuss/practice-module` branch，不進 `main`；定案的部分會分別搬進
`docs/architecture.md`（結構）、`CLAUDE.md`（規則）、或未來的 `docs/api-spec.md`（API）。

---

## 2026-09-24：跟團隊 Google Sheet（權威來源）對齊

團隊實際在用的規劃文件是這份 Google Sheet：
https://docs.google.com/spreadsheets/d/1LEfQwemO9nG_KCkgnH2_M8Hf1mULy_KM16vhxrdoU7s
（分頁「階段分工」＝ W2–W16 週次時程表；分頁「功能清單」＝ 每個功能的目標版範圍）。
**這份文件是草稿，跟 Sheet 衝突時以 Sheet 為準**，以下是對照後的修正：

**已確認、更新了下面模組表格的部分**：
- AI 回答（產生實際回應）用 **OpenAI 的 API**，不是 Anthropic Claude；4D 評分引擎的
  模型供應商 Sheet 沒明講，待確認
- 「AI 回答」「4D 評分引擎」都明確標註**教學提示與競賽提示共用**——資料/評分邏輯共用，
  但題目/案例的內容資料仍分開設計（呼應 [plan-practice-module.md 1-1](plan-practice-module.md)）
- **MVP 範圍比這份文件原本設想的小很多**：功能清單裡「關卡內容」「題庫挑題」
  「關卡解鎖與難度分級」「連續練習天數」都標「先不用」；「送出提示 3 次上限」
  「示範改寫」都標「簡化，之後再做」。目標版的練習題模組**一開始只要撐住「一關一題」**，
  題庫瀏覽、難度分級、次數上限都是之後才做的事
- 「查看學生名單、該班 4D 平均分數成長」（教師分析功能）Sheet 標「先不用」，直接排除，
  不用列入待討論

**發現的落差，需要跟團隊確認**：
- ⚠️ Sheet 的功能清單裡「建立課程、管理學生名單」只列在**教師**角色底下，
  沒有對應的**學生端**「我的課程」頁面項目——這跟這份文件原本補充的「課程管理要分
  教師/學生端」不完全一致，需要確認是刻意不需要（例如學生本來就不用瀏覽課程，
  只靠賽場代碼加入即可）、還是漏列
- Sheet 的「階段分工」分頁裡，W7 有一項「共用帳號／課程 API（小 Issue）」是分派給
  「教學後端」（即使用者本人）的，代表課程相關 API 有一部分工作量本來就算在這裡，
  且被標成「小 Issue」——工作量可能比這份文件先前假設的（需要跟競賽後端大量討論界線）
  要小

**Sheet 裡「所需資料欄位」「所需 API」欄位目前是空的**——這正是下面 ER 圖草稿要填補的
地方，之後定案的欄位建議直接回填 Sheet，而不是只留在這份文件裡（回填 Sheet 前需要先
跟使用者確認，因為那是團隊共用文件）。

---

## 五大功能模組總覽

大方向依使用者提出的五塊來拆：題庫管理、題目練習、登入與帳號管理、個人能力分析、課程管理。

### 1. 登入與帳號管理

| 項目 | 內容 |
|---|---|
| 功能項目 | 註冊／登入、角色判斷（學生／教師／開發者）、登出、修改個人基本資料、修改密碼 |
| 對應原型 | 學生端／教師端 SETTINGS 畫面的「帳號設定」區塊（登出、修改密碼按鈕目前都沒接） |
| 資料表雛形 | `User(id, name, email, password_hash, role, created_at)` |
| 待討論 | 登入方式（帳密／學校 SSO／Google 登入）；「開發者」是不是獨立角色、要不要專屬 UI；密碼修改要做成 modal 還是獨立頁面 |
| 優先度 | **最高**——團隊已定調這個要最先完成，因為課程、競賽、練習紀錄全部都要綁使用者身份 |

### 2. 課程管理

**2026-09-23 補充**：這塊要分「教師端」跟「學生端」兩套頁面——教師端原型已經有
（課程列表、課程詳情），但**學生端原型目前完全沒有「我的課程」頁面**，屬於原型沒
設計到、邏輯上該補的部分。

| 項目 | 內容 |
|---|---|
| 功能項目 | **教師端**：建立／編輯課程、管理學生名單、查看課程底下過往競賽紀錄。**學生端（新增）**：查看自己選修的課程列表、（可能）課程詳情頁顯示該課程曾發起的競賽 |
| 對應原型 | 教師端「課程列表」「課程詳情」畫面（學生名單 accordion、過往競賽紀錄 accordion）；學生端目前無對應畫面，需要新設計 |
| 資料表雛形 | `Course(id, teacher_id, name, term, schedule)`、`CourseEnrollment(course_id, student_id)` |
| 待討論 | ⚠️ **這塊算誰的範圍需要特別確認**——課程本身的 CRUD 偏「系統管理」性質，但「課程底下發起競賽」是競賽那塊的事。建議跟另一位後端一起開會，明確畫出「課程管理」跟「競賽」的界線在哪一支 API／哪一張表；學生端「我的課程」頁面要不要現在就設計，還是先用最簡單的清單頂著 |
| 優先度 | 高——僅次於登入權限，因為競賽依賴「課程」才能限制「只有選課學生能進入」 |

### 3. 題庫管理

⚠️ **MVP 範圍修正（依 Sheet 功能清單）**：「關卡內容」Sheet 標「簡化－先做一關中的一題就好」，
「其餘關卡內容」「題庫挑題」「關卡解鎖與難度分級」都標「先不用」。**這個模組近期幾乎不需要
做——只要一筆種子資料（1 題）就夠，完整的題庫 CRUD／難度分類／後台介面都是之後才做的事**，
不要一開始就投入心力做完整的題庫管理系統。

| 項目 | 內容 |
|---|---|
| 功能項目 | MVP：一題種子資料即可。之後才做：開發者新增／查詢／編輯練習題目、難度分類 |
| 對應原型 | 學生端原型裡的 `BANK_LIST`／`TASKS` 資料結構；教師端「新增題庫」UI 可參考格式，但那個是給教師建競賽案例用的，不同資料形狀（見 [plan-practice-module.md 1-1](plan-practice-module.md)） |
| 資料表雛形 | `PracticeQuestion(id, title, difficulty, brief, trap, prefill, checklist[])`——`rewrite_sample`（示範改寫）欄位可以先不加，Sheet 標這個是簡化項目 |
| 待討論 | 是否跟競賽共用（結論傾向不共用，見 1-1 討論）；種子資料的那 1 題內容要寫什麼 |
| 優先度 | **低（近期）**——只需一筆種子資料就能讓「題目練習」開始開發，完整題庫管理系統排在後面 |

### 4. 題目練習

⚠️ **MVP 範圍修正（依 Sheet 功能清單）**：「送出提示」標「簡化－可以送出即可，之後再設定
3 次上限」；「示範改寫」標「簡化－先以改善建議為主，有機會再加改寫」。**MVP 不用做次數
限制邏輯，也不用做示範改寫，先把「送出→拿到 4D 分數＋改善建議」這條路打通就好。**

| 項目 | 內容 |
|---|---|
| 功能項目 | MVP：選題進入練習、送出 prompt、呼叫雙 AI 模型（**OpenAI**，生成回應＋4D 評分＋改善建議）、紀錄提交結果。之後才做：3 次上限、示範改寫 |
| 對應原型 | 學生端「TASK PLAYER（dojo）」畫面 |
| 資料表雛形 | `Submission(id, user_id, question_id, attempt_no, prompt_text, scores_json, checklist_result, created_at)`——`attempt_no` 先記錄就好，不用真的拿來擋使用者 |
| 待討論 | 4D 評分引擎的模型供應商是否也是 OpenAI；評分 rubric 設計（見 [plan-practice-module.md 1-3](plan-practice-module.md)、[flow-practice-module.md 一、題目流程](flow-practice-module.md)） |
| 優先度 | **高**——這是整個平台的核心賣點與機制，建議題庫（種子資料）、登入完成後優先做這塊 |

### 5. 個人能力分析

| 項目 | 內容 |
|---|---|
| 功能項目 | 個人基本資料、4D 能力總覽（教學面 vs 競賽面平均）、練習紀錄列表 |
| 對應原型 | 學生端 PROFILE／HISTORY 畫面 |
| 資料表雛形 | 不一定需要獨立表，可能是從 `Submission`（＋競賽那邊的紀錄）聚合計算的查詢 API |
| 待討論 | 平均值計算範圍（最近 N 次 vs 全部歷史，見 [flow-practice-module.md 2-2](flow-practice-module.md)）；要不要跟競賽那邊的分數表打通做「綜合」報表 |
| 優先度 | 低——依賴前面幾塊先有資料才能分析，可以放最後 |

---

## 設計流程建議：功能設計跟資料庫設計要一起做，不要切成兩階段

2026-09-23 討論：不建議「先把所有畫面/流程設計完，才開始設計資料庫」，也不建議
反過來「資料庫先 100% 設計完才做功能設計」。理由：

- 兩份 HTML 原型 + [flow-practice-module.md](flow-practice-module.md) 其實已經藏著資料表該長怎樣的線索
  （例如原型的 `TASKS` 物件，直接告訴你「練習題」這個實體大概需要哪些欄位）。
- 等全部功能設計都定案才畫資料庫，容易畫出「畫面順但資料庫關聯畫不出來」的設計，
  回頭要改設計反而更費工。
- 但資料庫也不能整套先做完，因為很多欄位（例如個人能力分析要不要跨競賽/練習算平均）
  要等流程細節定案才知道怎麼設計。

**建議做法**：先畫一版「粗略的」ER 圖抓大方向（見下方草稿），之後每次某個模組的
流程細節定案，就回來補這張圖的細節，反覆迭代，而不是切成「設計期」「資料庫期」兩個
不重疊的階段。

**登入／User 模型是例外，要現在就先定案**（不只是「優先做」，是「現在就要決定長什麼樣」）：
因為 `Course`、`PracticeQuestion`、`Submission` 幾乎每張表都會參照 User，如果 User 的角色
設計（單一 role 欄位 vs 多張角色表）還沒定，後面的表會全部卡住重改。

### ER 圖草稿（v0.1，粗略版，僅供討論）

```mermaid
erDiagram
    USER ||--o{ COURSE : "teacher_id（若角色為教師）"
    USER ||--o{ COURSE_ENROLLMENT : "student_id"
    COURSE ||--o{ COURSE_ENROLLMENT : "course_id"
    USER ||--o{ PRACTICE_QUESTION : "created_by（若角色為開發者）"
    USER ||--o{ SUBMISSION : "user_id"
    PRACTICE_QUESTION ||--o{ SUBMISSION : "question_id"

    USER {
        id id
        string name
        string email
        string password_hash
        string role "student / teacher / developer"
        datetime created_at
    }
    COURSE {
        id id
        id teacher_id
        string name
        string term
        string schedule
    }
    COURSE_ENROLLMENT {
        id course_id
        id student_id
    }
    PRACTICE_QUESTION {
        id id
        string title
        string difficulty
        text brief
        text trap
        text prefill
        json checklist
        id created_by
    }
    SUBMISSION {
        id id
        id user_id
        id question_id
        int attempt_no
        text prompt_text
        json scores "d1 d2 d3 d4"
        json checklist_result
        text ai_response_text
        datetime created_at
    }
```

**這版草稿刻意先不畫的部分**（留給後面迭代，或跟競賽那邊討論後再補）：
- 競賽相關的表（Team、Case、CompetitionResult 等）——那是另一位後端的範圍，但 `USER`
  跟（可能）`COURSE` 會被兩邊共用，之後要跟他對一下欄位會不會衝突
- 「個人能力分析」沒有獨立的表，先假設是從 `SUBMISSION` 聚合算出來的查詢，如果之後
  發現算起來太慢，可能要加一張快取用的彙總表
- `USER.role` 先假設是單一欄位（一個帳號只有一種角色），如果之後發現「一個人可能
  同時是某堂課的學生、又是題庫開發者」，這裡要改成多對多的角色表

---

## 建議開發順序（對照 Sheet「階段分工」分頁的實際週次）

```
W3-W4：ERD／資料表定稿（教學面）、確認技術棧
W5：登入與帳號管理（登入與角色：可實際登入並導到對的頁面）＋後端骨架、資料庫建表
W6：題目練習主線打通（進關卡 → 送 prompt → 看 4D 回饋 → 紀錄存起來，1 題種子資料）
     └─ 課程管理（教師端）可平行進行，「共用帳號／課程 API」有一部分落在 W7 的小 Issue
W9：教學面收尾
之後：題庫管理擴充（多題、難度分類）、個人能力分析、次數限制、示範改寫
     （這些都是 Sheet 標「簡化」或「先不用」的項目，排在後面）
```

這比原本這份文件寫的「課程管理其次、題庫其次」順序更精確——**實際時程是登入跟題目練習
主線幾乎同時在 W5-W6 進行**，題庫本身因為 MVP 只要 1 題，不構成獨立的開發階段。

---

## 待跟團隊確認的事項彙總（2026-09-24 更新，已對過 Sheet）

- [ ] ⚠️ 學生端要不要有「我的課程」頁面——Sheet 功能清單沒列，需確認是刻意不需要還是漏列
- [ ] 課程管理的範圍界線——哪些 API／功能算「系統功能」、哪些算「競賽」的一部分（W7「共用
      帳號／課程 API」已知有一部分是使用者的小 Issue，但完整界線還沒畫清楚）
- [ ] 登入方式（帳密／SSO／學校帳號）——Sheet 自己也標「＞是否串學校帳號?」還沒答案
- [ ] 開發者角色要不要獨立 UI
- [ ] 4D 評分引擎的模型供應商是否也是 OpenAI（AI 回答已確定是 OpenAI）
- [ ] 4D 能力分析的計算範圍（教學面/競賽面怎麼合併算，Sheet 也標了同樣的問號）

**已經不用再討論、Sheet 已經給答案的**（從這份文件先前的待討論移除）：
- ~~題庫共用 vs 分開~~ → 評分引擎共用，題目內容分開（見上方「跟 Sheet 對齊」）
- ~~雙 AI 模型怎麼接~~ → 回答模型確定用 OpenAI API
- ~~查看學生名單、班級 4D 平均~~ → Sheet 標「先不用」，不用做

（以上細節分別在 [plan-practice-module.md](plan-practice-module.md) 跟 [flow-practice-module.md](flow-practice-module.md) 裡有更詳細的討論，這份文件是給團隊會議時看整體範圍用的摘要版。）
