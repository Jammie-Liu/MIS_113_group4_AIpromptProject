import { useState } from 'react'
import { LogoMark } from '../../landing/Landing.jsx'
import { ACCOUNT_ID_PATTERN, findAccount } from '../library.js'

/*
  教師登入／註冊（docs/system-flow.md 一）：
  目前只用 ID＋姓名，密碼先不做。登入只要輸入 ID；註冊要填 ID 和姓名，ID 不能跟別人重複，註冊完直接登入。
  帳號清單存在 TeacherApp 的 state，還沒接後端，重新整理或離開教師端就回到預設帳號。
  版面跟學生端輸入賽場代碼那頁一樣：上方黑色選單列只有 logo（點了回入口首頁），中間一個框，
  背景是同一套動態背景（TeacherApp 的 TeacherBackground）。
*/
const DEMO_ID = 'T001'

export default function TeacherAuth({ accounts, onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState('login') // 'login' 或 'register'
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  function submit(e) {
    e.preventDefault()
    const idTrim = id.trim()
    if (mode === 'login') {
      if (!idTrim) { setError('請輸入 ID'); return }
      const account = findAccount(accounts, idTrim)
      if (!account) { setError('找不到這個 ID，第一次使用請先註冊'); return }
      onLogin(account)
      return
    }
    if (!ACCOUNT_ID_PATTERN.test(idTrim)) { setError('ID 要是 3～20 個英文字母或數字'); return }
    if (findAccount(accounts, idTrim)) { setError('這個 ID 已經有人註冊了'); return }
    if (!name.trim()) { setError('請填姓名'); return }
    onRegister({ id: idTrim, name: name.trim() })
  }

  return (
    <div className="tl-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/" onClick={(e) => { e.preventDefault(); onBack() }}>
          <LogoMark />
          <span>Prompt Master</span>
        </a>
      </header>

      <form className="tl-card" onSubmit={submit} noValidate key={mode}>
        <h3>{mode === 'login' ? '教師登入' : '教師註冊'}</h3>
        <label className="tl-field">
          <span>ID</span>
          <input type="text" autoComplete="username" maxLength={20} placeholder="例：T001" value={id} autoFocus
            onChange={(e) => { setId(e.target.value); setError('') }} />
        </label>
        {mode === 'register' && (
          <label className="tl-field">
            <span>姓名</span>
            <input type="text" autoComplete="name" maxLength={20} placeholder="例：張欣綠" value={name}
              onChange={(e) => { setName(e.target.value); setError('') }} />
          </label>
        )}
        {error && <p className="tl-error" role="alert">{error}</p>}
        <div className="tl-actions">
          <button type="button" className="hint-btn ghost sm" onClick={mode === 'login' ? onBack : () => switchMode('login')}>
            {mode === 'login' ? '返回' : '返回登入'}
          </button>
          <button type="submit" className="hint-btn sm">{mode === 'login' ? '登入' : '註冊並登入'}</button>
        </div>
        {mode === 'login'
          ? <p className="tl-switch">還沒有帳號？<button type="button" onClick={() => switchMode('register')}>註冊</button></p>
          : <p className="tl-switch">已經有帳號？<button type="button" onClick={() => switchMode('login')}>登入</button></p>}
        {mode === 'login' && (
          <button type="button" className="tl-demo" onClick={() => { setId(DEMO_ID); setError('') }}>（Demo）填入示範帳號 {DEMO_ID}</button>
        )}
      </form>
    </div>
  )
}
