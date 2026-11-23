import crypto from 'node:crypto'
import { pool } from './pool.js'

/*
  假資料（seed）：給開發、測試用，讓前端接 API 時有東西可以拿。

  - 執行 `npm run seed`：先把所有競賽相關的表清空（編號也從 1 重新開始），再放進下面這份假資料。
    誰把測試資料弄亂了，跑一次就回到一樣的乾淨狀態。
  - ⚠️ 會刪掉表裡所有資料，只能在開發用的資料庫跑；NODE_ENV=production 時會拒絕執行。
  - 內容跟學生端 demo（frontend/src/pages/student/data.js 的 ARENA_CASE）、
    教師端假帳號（frontend/src/pages/teacher/library.js 的 SEED_ACCOUNTS）對得上。
  - 跟 migration 的差別：migration 改「資料表的結構」，正式上線也會跑；seed 只放「假的內容」。
*/

if (process.env.NODE_ENV === 'production') {
  console.error('✗ NODE_ENV=production，不能跑 seed（會清空資料）')
  process.exit(1)
}

const token = () => crypto.randomBytes(32).toString('hex') // 64 字元的通行碼

const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1. 清空（CASCADE：連帶清掉參照到它們的表；RESTART IDENTITY：編號從 1 重新開始）
  await client.query(`
    TRUNCATE professor, issue, label, issue_label, competition, question,
             basic_ans, student, message, score_4d, stu_ans
    RESTART IDENTITY CASCADE
  `)

  // 2. 老師
  const { rows: profs } = await client.query(`
    INSERT INTO professor (login_id, name) VALUES ('T001', '張欣綠'), ('T002', '王大明')
    RETURNING prof_id
  `)
  const [t001, t002] = profs.map((p) => p.prof_id)

  // 3. 題目（背景）＋標籤
  const { rows: [issue] } = await client.query(`
    INSERT INTO issue (topic, content, publicity, prof_id) VALUES ($1, $2, true, $3)
    RETURNING issue_id
  `, [
    '供應鏈勞動爭議',
    '「安心生活」是台灣中大型電商平台，其熱銷生活用品供應商近期被爆料涉及超時工作與未依法投保，引發社群輿論與媒體關注。財務長認為更換供應商將墊高短期成本並影響出貨穩定；永續長主張若不處理將重創品牌信任度；人資長則擔心倉促更換供應商會讓現有窗口的關係與合作細節出現斷層。',
    t002,
  ])
  const { rows: labels } = await client.query(`
    INSERT INTO label (l_name) VALUES ('供應鏈'), ('企業倫理') RETURNING l_id
  `)
  for (const { l_id } of labels) {
    await client.query('INSERT INTO issue_label (issue_id, l_id) VALUES ($1, $2)', [issue.issue_id, l_id])
  }

  // 4. 兩個問題（原因、解方）＋基本答案
  const boards = {
    原因: [
      '供應商為壓低成本而讓員工超時工作', '供應商未依法替員工投保', '平台對供應商缺乏勞動條件稽核',
      '採購合約沒有勞動條件的規範', '平台過度依賴單一供應商', '媒體與社群放大品牌信任危機',
    ],
    解方: [
      '提出立即更換供應商方案', '提出要求現供應商限期改善方案', '提出雙供應商並行過渡方案', '提出暫停下單、啟動稽核方案',
    ],
  }
  for (const [type, answers] of Object.entries(boards)) {
    const { rows: [q] } = await client.query(
      'INSERT INTO question (issue_id, type) VALUES ($1, $2) RETURNING q_id', [issue.issue_id, type])
    for (const content of answers) {
      await client.query('INSERT INTO basic_ans (q_id, content) VALUES ($1, $2)', [q.q_id, content])
    }
  }

  // 5. 競賽：代碼 000000（學生端測試預填的代碼）、4 組、應到 12 人、每階段 10 分鐘、還沒開始
  const { rows: [com] } = await client.query(`
    INSERT INTO competition (issue_id, prof_id, code, grp_num, stu_num, time)
    VALUES ($1, $2, '000000', 4, 12, 10) RETURNING com_id
  `, [issue.issue_id, t001])

  // 6. 幾個已經加入的假同學（分在不同組），選組畫面才看得出效果
  const students = [['林小美', 1], ['陳大文', 1], ['黃志明', 3]]
  for (const [name, group] of students) {
    await client.query(
      'INSERT INTO student (name, com_id, group_id, token) VALUES ($1, $2, $3, $4)',
      [name, com.com_id, group, token()])
  }

  await client.query('COMMIT')
  console.log('✓ 假資料放好了：老師 T001、T002；題目「供應鏈勞動爭議」；競賽代碼 000000；3 個假同學')
} catch (err) {
  await client.query('ROLLBACK')
  console.error('✗ seed 失敗，已全部回復：', err.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
