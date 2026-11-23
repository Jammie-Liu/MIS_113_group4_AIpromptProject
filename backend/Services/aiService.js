/*
  跟 AI 對話。⚠️ 目前是「假回覆」：還沒串真的 AI，先回固定的列點，讓前端能接、流程能跑。
  串 AI 的組員接手時只要改 replyToStudent，回傳格式 { intro, points } 不變。
*/

const FAKE_POINTS = {
  原因: [
    '供應商為了壓低成本，讓員工超時工作',
    '平台沒有定期稽核供應商的勞動條件',
    '採購合約裡沒有勞動條件的規範',
    '平台太依賴單一供應商，不敢要求',
    '社群和媒體讓事件快速擴散',
  ],
  解方: [
    '要求現在的供應商限期改善，並派人稽核',
    '同時找第二家供應商，雙供應商並行過渡',
    '暫停下單，等稽核結果再決定',
    '對外發聲明，說明平台的處理進度',
  ],
}

export async function replyToStudent({ stageType /* '原因' | '解方' */, content }) {
  return {
    intro: `（示範回覆，還沒接真的 AI）關於「${content.slice(0, 30)}」，可以從這幾點思考：`,
    points: FAKE_POINTS[stageType],
  }
}
