import { useState } from 'react'
import { formatTime } from '../library.js'

/*
  個人帳號管理（右上角人像圖示進來）：帳號資料（ID 不能改、姓名可以改）、歷史競賽紀錄、登出。
  歷史競賽紀錄＝自己發起、已經結束的競賽，新的排最上面。
*/
export default function Account({ user, history, banks, onRename, onLogout, onOpenBank }) {
  const [name, setName] = useState(user.name)
  const [saved, setSaved] = useState(false)
  const nameTrim = name.trim()

  function save(e) {
    e.preventDefault()
    if (!nameTrim || nameTrim === user.name) return
    onRename(nameTrim)
    setSaved(true)
  }

  const sorted = [...history].sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))

  return (
    <>
      <section className="home-section" aria-labelledby="accTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">ACCOUNT</p>
            <h2 id="accTitle">帳號資料</h2>
          </div>
          <button type="button" className="hint-btn ghost sm" onClick={onLogout}>登出</button>
        </div>
        <form className="case-form course-form acc-form" onSubmit={save}>
          <label>ID</label>
          <div className="acc-id mono">{user.id}<small>ID 註冊後不能修改</small></div>
          <label htmlFor="accName">姓名</label>
          <div className="cf-field acc-name">
            <input id="accName" type="text" maxLength={20} value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
            <button type="submit" className="hint-btn sm" disabled={!nameTrim || nameTrim === user.name}>儲存</button>
            {saved && <small className="lib-hint" role="status">已儲存</small>}
          </div>
        </form>
      </section>

      <section className="home-section" aria-labelledby="accHistoryTitle">
        <div className="home-section-heading">
          <div>
            <p className="home-section-kicker">HISTORY</p>
            <h2 id="accHistoryTitle">歷史競賽紀錄</h2>
            <p>你發起、已經結束的競賽。</p>
          </div>
        </div>
        {sorted.length === 0 ? (
          <div className="nh-empty">還沒有結束的競賽。</div>
        ) : (
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
                  <span role="cell">{c.groupCount} 組・上限 {c.groupCap} 人</span>
                  <span role="cell">{c.rounds} 回合・{c.timeLimit} 分</span>
                  <span role="cell">{c.avgScore ?? '—'}</span>
                  <span role="cell" className="mono">{formatTime(c.endedAt)}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
