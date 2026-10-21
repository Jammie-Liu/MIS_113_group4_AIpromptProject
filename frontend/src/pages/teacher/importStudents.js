/*
  老師「批次匯入學生」：讀 CSV 檔，整理成 [{ name, email, dept }]，再檢查每一列能不能加入。
  只用瀏覽器內建功能，不需要額外套件。

  為什麼要這樣寫：
  - 編碼：Excel（尤其 Windows 版）存中文 CSV 常是 Big5，不是 UTF-8；直接用 UTF-8 讀會變亂碼。
    所以先用 UTF-8「嚴格模式」解碼，遇到不合法的位元組就改用 Big5。
  - CSV 格式：欄位裡可能有逗號或換行，這種欄位會用雙引號包起來（"台北市, 大安區"），
    雙引號本身寫成兩個雙引號（""）。所以不能單純用 split(',')，要一個字一個字讀。
  - 欄位名稱：每個學校匯出的名單欄位名稱不一樣，所以認幾種常見寫法；沒有標題列時，
    改用「哪一欄大部分像信箱」來猜。
*/

// 選檔時也讓老師選得到 Excel，選了會看到「請另存成 CSV」的說明
export const ACCEPTED_FILES = '.csv,.xlsx,.xls'

const HEADER_ALIASES = {
  name: ['姓名', '學生姓名', '名字', 'name', 'student name', 'fullname', 'full name'],
  email: ['信箱', '電子郵件', '電子信箱', 'email', 'e-mail', 'mail', '學校信箱'],
  dept: ['系級', '系所', '科系', '系別', '班級', 'department', 'dept', 'class'],
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

// 位元組 → 文字：先試 UTF-8（嚴格），失敗就用 Big5
export function decodeText(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch (e) {
    return new TextDecoder('big5').decode(buffer)
  }
}

// CSV 文字 → 二維陣列（一列一個陣列）
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '') // 去掉 Excel 加在開頭的 BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''))
}

// 二維陣列 → [{ name, email, dept }]：先找標題列；找不到就猜哪一欄是信箱、哪一欄是姓名
export function rowsToStudents(rows) {
  if (rows.length === 0) return { students: [], headerFound: false }
  const norm = (v) => String(v ?? '').trim().toLowerCase()
  const header = rows[0].map(norm)
  const col = {}
  Object.entries(HEADER_ALIASES).forEach(([key, aliases]) => {
    const idx = header.findIndex((h) => aliases.includes(h))
    if (idx >= 0) col[key] = idx
  })
  let body = rows
  let headerFound = false
  if (col.name !== undefined && col.email !== undefined) {
    headerFound = true
    body = rows.slice(1)
  } else {
    const width = Math.max(...rows.map((r) => r.length))
    const emailScore = Array.from({ length: width }, (_, c) => rows.filter((r) => EMAIL_RE.test(String(r[c] ?? '').trim())).length)
    col.email = emailScore.indexOf(Math.max(...emailScore))
    col.name = col.email === 0 ? 1 : 0
    col.dept = [0, 1, 2].find((c) => c !== col.email && c !== col.name && c < width)
    // 第一列如果不像資料（信箱欄不是信箱），當作看不懂的標題列跳過
    if (!EMAIL_RE.test(String(rows[0][col.email] ?? '').trim())) body = rows.slice(1)
  }
  const students = body.map((r, i) => ({
    line: i + (body === rows ? 1 : 2), // 檔案裡的第幾列，錯誤訊息用
    name: String(r[col.name] ?? '').trim(),
    email: String(r[col.email] ?? '').trim(),
    dept: col.dept !== undefined ? String(r[col.dept] ?? '').trim() : '',
  }))
  return { students, headerFound }
}

// 讀檔：CSV 用上面的方法；其他格式回傳錯誤訊息
export async function readStudentFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext !== 'csv') {
    return { error: ext === 'xlsx' || ext === 'xls'
      ? '目前先支援 CSV。Excel 檔可以在 Excel 裡「另存新檔 → CSV（逗號分隔）」再匯入。'
      : '只支援 CSV 檔。' }
  }
  const text = decodeText(await file.arrayBuffer())
  return rowsToStudents(parseCsv(text))
}

/*
  檢查每一列能不能加入，回傳每一列的 status：
    ok 可以加入｜noName 缺姓名｜badEmail 信箱格式不對｜exists 已經在名單｜pending 已經在待審核申請｜dup 檔案裡重複｜full 超過人數上限
  existingEmails、pendingEmails 是小寫信箱的 Set；remaining 是課程還剩幾個名額。
*/
export function checkStudents(students, { existingEmails, pendingEmails, remaining }) {
  const seen = new Set()
  let okCount = 0
  return students.map((st) => {
    const key = st.email.toLowerCase()
    let status = 'ok'
    if (!st.name) status = 'noName'
    else if (!EMAIL_RE.test(st.email)) status = 'badEmail'
    else if (existingEmails.has(key)) status = 'exists'
    else if (pendingEmails.has(key)) status = 'pending'
    else if (seen.has(key)) status = 'dup'
    else if (okCount >= remaining) status = 'full'
    if (EMAIL_RE.test(st.email)) seen.add(key)
    if (status === 'ok') okCount++
    return { ...st, status }
  })
}

export const STATUS_TEXT = {
  ok: '可以加入',
  noName: '缺姓名',
  badEmail: '信箱格式不對',
  exists: '已經在名單裡',
  pending: '已在待審核申請（請到待審核核准）',
  dup: '檔案裡重複',
  full: '超過人數上限',
}

// 範例檔：老師可以下載來照格式填（加 BOM，Excel 打開才不會亂碼）
export function sampleCsvUrl() {
  const csv = '﻿姓名,信箱,系級\n王小明,s1111001@nccu.edu.tw,資管二\n陳小美,s1111002@nccu.edu.tw,企管三\n'
  return URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}
