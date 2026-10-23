import express from 'express'
import healthRouter from './Routes/health.js'

/*
  後端進入點。
  - 所有 API 都掛在 /api/v1 底下（docs/api-teacher.md「通用約定」）。
  - 之後新增功能的順序：Routes（網址）→ Controllers（處理請求）→ Models / Services（資料表、AI）。
*/

const app = express()
app.use(express.json())

app.use('/api/v1', healthRouter)

// 找不到的網址，照 api-teacher.md 的錯誤格式回傳
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `找不到 ${req.method} ${req.path}` } })
})

// 其他沒接住的錯誤：記在後端 log，回給前端時不透露內部細節
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '伺服器發生錯誤' } })
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`後端已啟動：http://localhost:${port}/api/v1/health`)
})
