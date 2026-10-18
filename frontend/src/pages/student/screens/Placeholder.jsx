/* 尚未從原型轉成 React 的畫面（我的課程／競賽紀錄／個人資料／設定等），
   之後會依分階段計畫陸續轉換；目前先給一個不會讓導覽卡住的佔位畫面。
   完整版可參考 frontend/src/prototypes/學生端/index.html 同名畫面。 */
export default function Placeholder({ title, onBack }) {
  return (
    <div className="panel">
      <div className="stu-placeholder">「{title}」這個畫面還在分階段轉換成 React 的過程中，敬請期待。</div>
      <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" style={{ marginTop: 14 }} onClick={onBack}>← 回首頁</button>
    </div>
  );
}
