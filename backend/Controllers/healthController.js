import { query } from '../db/pool.js'

/*
  GET /api/v1/health
  用來確認「後端有開、而且連得到資料庫」。部署後也可以讓主機定期打這支檢查服務是否正常。
*/
export async function getHealth(req, res) {
  try {
    const { rows } = await query('SELECT now() AS now, current_database() AS database')
    res.json({ ok: true, db: { connected: true, database: rows[0].database, time: rows[0].now } })
  } catch (err) {
    console.error('資料庫連線失敗：', err.message)
    res.status(503).json({ ok: false, error: { code: 'DB_UNAVAILABLE', message: '連不到資料庫' } })
  }
}
