# 登入與角色設計（草案）

- 狀態：2026-10-09，討論草案，尚未和亭慧、芷琳、芊穎、苡瑄確認
- 範圍：登入、帳號、課程、角色／權限、題目出題權限。競賽的詳細規則（回合、評分、分組）不在這份文件內，那是亭慧／芷琳的範圍，這裡只處理「因為登入改動，競賽表需要跟著調整的部分」
- 背景討論見對話紀錄；課程加入、公開/私密的雛形已經在 `docs/system-flow.md`（`docs/ai-logic-design` 分支）裡有草稿，這份文件定案後要回頭更新那份

---

## 1. 決定摘要

- **帳號是扁平的,角色是情境性的**。沒有「學生」「老師」「開發者」這種寫死在帳號上的身份欄位,只有一種 Account。
- **登入只用 Google,完全不設密碼**。
- **學生身份**:從 Google 登入信箱判斷,假設學號就是信箱帳號前綴(多數學校是這樣),解析成功就存起來;解析不出來就留空,讓使用者自己補。
- **老師身份＝課程擁有者**。不驗證、不審核——誰建課程,誰就是那門課的老師,自己邀請學生、告訴學生自己的帳號是哪個。
- **老師可以用學號批量加學生**,學生當下可能還沒登入過,系統先建一筆「待認領」紀錄,等那個學生真的用 Google 登入、信箱解析出同一個學號,兩筆資料自動接起來。
- **課程有公開／私密**:公開課程的內容全部開放;私密課程加入後要審核。
- **競賽從課程裡開**,預設該課程全部學生參加;另外有「代碼加入」這個備用入口,讓課程名單外的人也能加入同一場競賽——但目前仍需要登入(代碼＋完全免登入是團隊已經想過、但明確排除在 MVP 外的擴充功能)。
- **出題權限是獨立的能力,不跟著身份走**:開發者先鋪種子題、AI 之後依使用狀況定期生題(開發者只負責審題)、公開課程老師出的作業/講義衍生題也會進公開題庫。另外保留「使用者夠厲害可以解鎖出題」這個機制的位置,但具體門檻還沒定義(見問題 5)。

---

## 2. 資料庫改動

延續 `practice-db-tables.md` 的寫法(欄位/意義/型態/限制)。這裡列的是**新增或修改**的表,`User` 全面改名成 `Account` 並拿掉原本 `role` 欄位的概念。

### Account(取代 User)— 修改

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| id | 帳號 ID | int | PK | 沿用 |
| google_sub | Google 帳號的唯一 ID(不是 email,因為 email 可能換) | varchar | UNIQUE, NOT NULL | 新增 |
| email | 登入信箱 | varchar | NOT NULL | 沿用 |
| email_domain | 信箱網域,用來判斷「同校」 | varchar | NOT NULL | 新增 |
| display_name | 顯示名稱 | varchar | NOT NULL | 沿用 |
| avatar_url | 頭貼 | varchar | nullable | 沿用 |
| student_id | 學號:從信箱解析,或使用者自己補填 | varchar | nullable | 新增 |
| created_at | 建立時間 | datetime | NOT NULL | 沿用 |
| last_login_at | 最後登入時間 | datetime | NOT NULL | 新增 |

- **移除** `role` 欄位(原本 student/teacher 的 enum)。身份改由 `CourseMembership`、`AuthorshipGrant` 這些表動態決定,不是帳號的固有屬性。

### PendingStudent(老師批量加學生的佔位紀錄)— 新增

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| course_id | 哪門課加的 | int | FK→Course, NOT NULL | 新增 |
| student_id | 學號(老師填的) | varchar | NOT NULL | 新增 |
| display_name | 姓名(老師填的,方便自己識別) | varchar | nullable | 新增 |
| added_by | 哪個老師加的 | int | FK→Account, NOT NULL | 新增 |
| claimed_account_id | 真正登入、比對成功後填入 | int | FK→Account, nullable | 新增 |
| created_at | 建立時間 | datetime | NOT NULL | 新增 |
| (約束) | | | UNIQUE(course_id, student_id) | |

學生用 Google 登入、`Account.student_id` 解析出來後,系統查有沒有同課程、同學號、`claimed_account_id` 還是空的 `PendingStudent`,有的話自動連起來,等於把這個學生正式加入 `CourseMembership`。

### Course — 新增

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| name | 課程名稱 | varchar | NOT NULL | 新增 |
| description | 課程介紹 | text | nullable | 新增 |
| visibility | 公開／私密 | enum(public,private) | NOT NULL, default=private | 新增 |
| capacity | 人數限制 | int | nullable | 新增 |
| owner_account_id | 課程擁有者(＝這門課的「老師」,建立者自動成為) | int | FK→Account, NOT NULL | 新增 |
| publish_at | 發布時間 | datetime | nullable | 新增 |
| end_at | 課程結束時間 | datetime | nullable, default=建立時間+6個月 | 新增 |
| pricing_mode | 收費模式(【預留,MVP 不做】) | enum(free,paid) | NOT NULL, default=free | 新增 |
| price | 價錢(【預留,MVP 不做】,pricing_mode=paid 時才有意義) | decimal | nullable | 新增 |
| created_at | 建立時間 | datetime | NOT NULL | 新增 |

### CourseMembership — 新增

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| course_id | 課程 | int | FK→Course, NOT NULL | 新增 |
| account_id | 成員帳號 | int | FK→Account, NOT NULL | 新增 |
| status | 狀態:active=正式成員;pending_approval=私密課程申請加入、等老師審核 | enum(active,pending_approval) | NOT NULL, default=active | 新增 |
| joined_at | 加入時間 | datetime | NOT NULL | 新增 |
| (約束) | | | UNIQUE(course_id, account_id) | |

### AuthorshipGrant(出題權限)— 新增

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| id | ID | int | PK | 新增 |
| account_id | 擁有出題權限的帳號 | int | FK→Account, UNIQUE, NOT NULL | 新增 |
| granted_reason | 核准原因 | enum(manual,reputation) | NOT NULL | 新增 |
| granted_by | 誰核准的(manual 才有值;reputation 自動核准則為 null) | int | FK→Account, nullable | 新增 |
| granted_at | 核准時間 | datetime | NOT NULL | 新增 |

MVP 建議只用 `manual`(開發者手動給),`reputation` 的自動核准機制保留欄位、先不實作(見問題 5)。

### PracticeQuestion — 再修改(在 `practice-db-tables.md` 既有修改之上再加)

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| source_type | 題目來源 | enum(developer_seed,ai_generated,course_authored,user_authored) | NOT NULL, default=developer_seed | 新增 |
| author_account_id | 出題者(developer_seed 可為 null) | int | FK→Account, nullable | 新增 |
| course_id | 若由某課程的講義/作業衍生 | int | FK→Course, nullable | 新增 |
| review_status | 審核狀態:developer_seed 直接 approved;ai_generated、user_authored 預設 pending_review | enum(approved,pending_review,rejected) | NOT NULL, default=approved | 新增 |
| visibility | 公開範圍:建立當下依課程公開狀態「拍照」存一份,之後課程改公開狀態不回溯影響 | enum(public,course_only) | NOT NULL, default=public | 新增 |

### Competition — 因登入改動需要調整的部分(細節交給芷琳確認)

| 欄位 | 意義 | 型態 | 限制 | 差異 |
|---|---|---|---|---|
| course_id | 所屬課程,**改成必填**,因為競賽一定從課程開 | int | FK→Course, NOT NULL | 修改 |
| join_code | 代碼加入用的代碼,有值代表開放代碼加入 | varchar | UNIQUE, nullable | 新增 |
| created_by | 原本可能指向 User 的欄位全部改指向 Account | int | FK→Account | 修改(改 FK 對象) |

---

## 3. API 改動

延續 `api-draft.md` 的寫法,只列需要什麼,格式細節之後再定。

### 登入／帳號

| Method | Path | 用途 |
|---|---|---|
| POST | /auth/google | 用 Google ID token 換系統登入狀態。首次登入會建立 Account,並嘗試解析 student_id、比對 PendingStudent 自動認領 |
| GET | /me | 目前帳號資料,含算出來的能力:擁有的課程列表、是否有出題權限、student_id |
| POST | /me/student-id | 系統解析不出學號時,使用者手動補填 |

### 課程

| Method | Path | 用途 |
|---|---|---|
| POST | /courses | 建立課程(建立者自動成為 owner) |
| GET | /courses | 列出課程(我的課程/瀏覽公開課程,視頁面而定) |
| GET | /courses/:id | 課程詳情 |
| POST | /courses/:id/members | 老師批量加學生(傳學號清單,建立 PendingStudent 或直接連到已存在帳號) |
| POST | /courses/:id/join | 用代碼/QR 加入。public 直接成為 active 成員;private 建立 pending_approval |
| POST | /courses/:id/members/:membershipId/approve | 老師審核私密課程的加入申請 |

### 競賽

| Method | Path | 用途 |
|---|---|---|
| POST | /courses/:id/competitions | 建立競賽(只有該課程 owner 可以),可選是否產生 join_code |
| POST | /competitions/:id/join | 用代碼加入(需登入);課程內學生預設已是參賽者,不用另外呼叫 |
| GET | /competitions/:id | 競賽詳情 |

### 題目審核(出題權限)

| Method | Path | 用途 |
|---|---|---|
| POST | /questions | 新增題目,需要有出題權限(AuthorshipGrant 存在,或是系統種子匯入) |
| GET | /questions/pending-review | 待審題目列表(開發者用) |
| POST | /questions/:id/review | 核准或退回 |

---

## 4. 可能的問題

| # | 問題 | 影響 | 建議方向 |
|---|---|---|---|
| 1 | 學號擷取只是「信箱前綴＝學號」的假設,沒有涵蓋所有學校格式,也沒定義解析失敗時的使用者流程 | 部分學校的使用者 student_id 會是空的 | 解析失敗就留空,前端在個人資料頁提示使用者自己填,不要卡登入流程 |
| 2 | PendingStudent 認領比對規則沒定(學號有無前導零、英數大小寫,各校格式不一致) | 老師加的學號可能永遠對不上系統解析出來的學號 | 比對前先統一正規化(去空白、轉大寫)再比對,正規化規則要和各校實際學號格式一起確認 |
| 3 | 用代碼加入競賽的人,算不算加入整個課程? | 如果不是,這個人要怎麼看到競賽相關但課程才有的資料(例如課程公開的講義)? | 代碼加入只給這場競賽的參賽資格,不自動建立 CourseMembership,競賽相關資料另外獨立判斷權限 |
| 4 | 課程公開不應該包含學生作答的對話內容,只應該公開「題目本身」 | PracticeQuestion.visibility 目前只管題目層級,沒有限制到 PracticePromptLog | 後端 API 要在對話紀錄層級另外把關,不能只靠題目的 visibility 欄位 |
| 5 | 「等級／聲量」解鎖出題權限的具體門檻還沒定義(根據 4D 平均分數?根據其他使用者的讚或引用次數?後者目前系統裡根本沒有這個機制) | AuthorshipGrant.reputation 這條路線做不出來 | MVP 先只用 manual(開發者手動核准),reputation 自動解鎖列為之後擴充,不要卡在這裡 |
| 6 | 課程公開／私密是會變動的開關,不是固定值。課程公開過、題目已經進公開題庫,之後老師改回私密,那些題目要不要收回? | 資料一致性問題 | PracticeQuestion.visibility 在題目「建立當下」拍照存一份,課程之後改狀態不回溯影響已經公開出去的題目,老師要收回要自己個別下架 |
| 7 | 競賽現在設計成一定要掛在課程底下(course_id 必填),對「只是想辦一場快閃競賽」的一般講師多了一步 | 使用門檻 | 影響不大,因為建課程本身也零門檻(自動成 owner、不用審核),先維持這個假設 |
| 8 | 題庫頁面原本規劃在「教師端」,帳號模型扁平化後這個頁面歸屬要重新定義 | 前端路由/UI 要跟著改,之前已經在跟芊穎對 PR 時提過 | 題庫頁變成所有人可進,「新增題目」按鈕依 AuthorshipGrant 有無顯示 |
| 9 | `docs/system-flow.md` 的登入段落還停在「信箱＋密碼,或免密碼驗證信」的草稿,跟這次「只用 Google」的決定不一致 | 其他組員看到的還是舊版 | 這份文件定案後要回去更新 system-flow.md,這是 CLAUDE.md 規定大家共讀共改的主線文件 |
| 10 | 完全沒有密碼,純 Google OAuth,session/token 怎麼存、多久過期還沒定 | 實作時的細節,不影響現在的資料表設計 | 留到後端骨架開工時再處理,風險對畢業專題規模可以接受 |
| 11 | 課程未來希望能收費,目前只在 Course 表預留 `pricing_mode`／`price` 欄位,金流、退費、發票這些完全沒設計 | 真的要做會牽涉第三方金流串接,工程量不小 | MVP 不做,欄位先留著讓之後加功能不用改表結構;真的要做時另開一份金流設計文件 |

其中 **第 1、5、9 點**目前最容易卡住後續實作,其他多半是「先用簡單版本,之後再擴充」就能往下走。
