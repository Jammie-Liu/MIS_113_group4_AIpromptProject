import express from 'express'
import healthRouter from './Routes/health.js'
import studentRouter from './Routes/student.js'
import devRouter from './Routes/dev.js'
import { errorHandler } from './Middleware/httpError.js'

/*
  後端進入點。
  - 所有 API 都掛在 /api/v1 底下（docs/api-teacher.md「通用約定」）。
  - 之後新增功能的順序：Routes（網址）→ Controllers（處理請求）→ Models / Services（資料表、AI）。
*/

const app = express()
app.use(express.json())

app.use('/api/v1', healthRouter)
app.use('/api/v1', studentRouter)
// 開發測試專用（Demo 老師按鈕），正式上線不掛
if (process.env.NODE_ENV !== 'production') app.use('/api/v1', devRouter)

// 找不到的網址，照 api-teacher.md 的錯誤格式回傳
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `找不到 ${req.method} ${req.path}` } })
})

// 錯誤統一在這裡轉成 { error: { code, message } }（Middleware/httpError.js）
app.use(errorHandler)

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`後端已啟動：http://localhost:${port}/api/v1/health`)
})
