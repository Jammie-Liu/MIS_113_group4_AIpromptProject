import { formatTime } from '../library.js'

/*
  歷史競賽紀錄（2026-11-25）：首頁「進行中的競賽」標題旁邊按「查看歷史競賽紀錄」進來，
  完整列出自己發起、已經結束的競賽，新的在最上面。最上面的「← 回教師端首頁」由 TeacherApp 統一加。
  已結束＝老師按「確認評分」公布結果；一個回合都沒評完就結束的也算，但沒有分數。
*/
export default function History({ history, banks, user, onOpenBank }) {
  return (
    <section className="home-section" aria-labelledby="histTitle">
      <div className="home-section-heading">
        <div>
          <p className="home-section-kicker">HISTORY</p>
          <h2 id="histTitle">歷史競賽紀錄</h2>
          <p>你發起、已經結束的競賽，共 {history.length} 場，新的在最上面。</p>
        </div>
      </div>
      {history.length === 0 ? <div className="nh-empty">還沒有結束的競賽。</div> : <HistoryTable history={history} banks={banks} user={user} onOpenBank={onOpenBank} />}
    </section>
  )
}

function HistoryTable({ history, banks, user, onOpenBank }) {
  const sorted = [...history].sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))
  return (
    <div className="acc-history" role="table" aria-label="歷史競賽紀錄">
      <div className="acc-row head" role="row">
        <span role="columnheader">競賽</span>
        <span role="columnheader">分組</span>
        <span role="columnheader">回合</span>
        <span role="columnheader">平均分數</span>
        <span role="columnheader">結束時間</span>
      </div>
      {sorted.map((c) => {
        const bank = banks.find((b) => b.id === c.bankId)
        const canOpen = bank && (bank.visibility === 'public' || bank.ownerId === user.id)
        return (
          <div key={c.id} className="acc-row" role="row">
            <span role="cell">
              <b>{c.title}</b>
              <small className="mono">代碼 {c.code}</small>
              {canOpen && <button type="button" className="lib-link" onClick={() => onOpenBank(bank)}>看題庫</button>}
            </span>
            <span role="cell">{c.groupCount ? `${c.groupCount} 組・上限 ${c.groupCap} 人` : '—'}</span>
            <span role="cell">{c.rounds} 回合・{c.timeLimit} 分</span>
            <span role="cell">{c.avgScore ?? '—'}</span>
            <span role="cell" className="mono">{formatTime(c.endedAt)}</span>
          </div>
        )
      })}
    </div>
  )
}
