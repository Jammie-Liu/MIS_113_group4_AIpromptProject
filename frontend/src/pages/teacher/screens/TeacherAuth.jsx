import { useState } from 'react'
import { ACCOUNT_ID_PATTERN, findAccount } from '../library.js'

/*
  教師登入／註冊（docs/system-flow.md 一）：
  目前只用 ID＋姓名，密碼先不做。登入只要輸入 ID；註冊要填 ID 和姓名，ID 不能跟別人重複。
  帳號清單存在 TeacherApp 的 state，還沒接後端，重新整理或離開教師端就回到預設帳號。
*/
export default function TeacherAuth({ accounts, onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState('login')
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
    <div className="auth-page">
      <form className="auth-card pop-in" onSubmit={submit} noValidate>
        <p className="home-section-kicker">TEACHER</p>
        <h1>{mode === 'login' ? '教師登入' : '註冊教師帳號'}</h1>
        <div className="auth-tabs" role="tablist" aria-label="登入或註冊">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')}>登入</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'on' : ''} onClick={() => switchMode('register')}>註冊</button>
        </div>

        <label htmlFor="authId">ID</label>
        <input id="authId" type="text" autoComplete="username" maxLength={20} placeholder="例：T001" value={id} onChange={(e) => { setId(e.target.value); setError('') }} autoFocus />

        {mode === 'register' && (
          <>
            <label htmlFor="authName">姓名</label>
            <input id="authName" type="text" autoComplete="name" maxLength={20} placeholder="例：張欣綠" value={name} onChange={(e) => { setName(e.target.value); setError('') }} />
          </>
        )}

        {error && <div className="auth-error" role="alert">{error}</div>}

        <button type="submit" className="hint-btn">{mode === 'login' ? '登入' : '註冊並登入'}</button>
        <p className="auth-note">
          {mode === 'login' ? '目前還沒有密碼，輸入 ID 就能登入。示範帳號：T001（張欣綠）、T002（王大明）' : '目前還沒有密碼，之後接上後端會再補。'}
        </p>
        {onBack && <button type="button" className="auth-back" onClick={onBack}>← 回入口首頁</button>}
      </form>
    </div>
  )
}
