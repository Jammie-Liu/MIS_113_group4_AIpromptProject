import { useState } from 'react'

/*
  個人帳號管理（右上角頭像選單 › 帳號資訊）：帳號資料（ID 不能改、姓名可以改）、登出。
  歷史競賽紀錄 2026-11-25 移到首頁「競賽 › 歷史紀錄」。
*/
export default function Account({ user, onRename, onLogout }) {
  const [name, setName] = useState(user.name)
  const [saved, setSaved] = useState(false)
  const nameTrim = name.trim()

  function save(e) {
    e.preventDefault()
    if (!nameTrim || nameTrim === user.name) return
    onRename(nameTrim)
    setSaved(true)
  }

  return (
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
  )
}
