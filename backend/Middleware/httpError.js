/*
  統一的錯誤：在 controller 裡 `throw new HttpError(409, 'NO_GROUP', '請先選組別')`，
  index.js 最後的錯誤處理會照 docs/api-student.md 第 0 節的格式回傳：
    { "error": { "code": "NO_GROUP", "message": "請先選組別" } }
*/
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } })
  }
  // 前端送來的 JSON 格式壞掉（express.json() 解析失敗）
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'JSON 格式不正確' } })
  }
  // 其他沒預料到的錯誤：記在後端 log，回給前端時不透露內部細節
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '伺服器發生錯誤' } })
}
