import fs from 'node:fs'
import { pool } from './pool.js'

/*
  資料表「慢慢長出來」的方法：migration（資料庫變更紀錄）。

  - 每次要建表、加欄位，就在 backend/migrations/ 新增一個 SQL 檔，檔名用三位數編號開頭，
    例如 001_create_users.sql、002_add_course_tags.sql。
  - 執行 `npm run migrate`，這支程式會照編號順序，只跑「還沒跑過」的檔案，
    並記錄在資料庫的 schema_migrations 表裡。
  - 已經跑過的檔案不要再改；要修改資料表就新增下一個編號的檔案。
    這樣每個組員的資料庫、正式資料庫都能用同一串步驟變成一樣的結構。
*/

const dir = new URL('../migrations/', import.meta.url)

const client = await pool.connect()
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  const { rows } = await client.query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.name))

  const files = fs.readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort()
  const pending = files.filter((f) => !applied.has(f))

  if (pending.length === 0) {
    console.log('資料表已是最新，沒有要執行的 migration。')
  }

  for (const file of pending) {
    const sql = fs.readFileSync(new URL(file, dir), 'utf8')
    // 一個檔案包成一個交易：中間出錯就整個退回，不會只建一半。
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log(`✓ ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(`✗ ${file} 執行失敗，已退回：${err.message}`)
      process.exitCode = 1
      break
    }
  }
} finally {
  client.release()
  await pool.end()
}
