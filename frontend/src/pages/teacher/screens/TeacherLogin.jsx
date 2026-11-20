import { useState } from 'react'
import { LogoMark } from '../../landing/Landing.jsx'
import { DEMO_ACCOUNTS, verifyTeacherLogin } from '../data.js'

/*
  教師登入：從首頁按「教師」入口進來先到這裡，驗證通過（帳密正確、而且是教師帳號）才進教師端。
  版面跟學生端輸入賽場代碼那頁一樣：上方黑色選單列只有 logo，中間一個登入框，背景是同一套動態背景
  （TeacherApp 的 TeacherBackground）。
  還沒接後端：帳號是 data.js 的 DEMO_ACCOUNTS，「（Demo）填入測試教師帳號」方便組員測試。
*/
export default function TeacherLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('請輸入信箱和密碼'); return }
    const result = verifyTeacherLogin(email, password)
    if (!result.ok) { setError(result.error); return }
    onLogin(result.account)
  }

  function fillDemoTeacher() {
    const demo = DEMO_ACCOUNTS.find((a) => a.role === 'teacher')
    setEmail(demo.email)
    setPassword(demo.password)
    setError('')
  }

  return (
    <div className="tl-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/" onClick={(e) => { e.preventDefault(); onBack() }}>
          <LogoMark />
          <span>Prompt Master</span>
        </a>
      </header>

      <form className="tl-card" onSubmit={handleSubmit} noValidate>
        <h3>教師登入</h3>
        <label className="tl-field">
          <span>學校信箱</span>
          <input
            type="email"
            autoComplete="username"
            placeholder="name@school.edu.tw"
            value={email}
            autoFocus
            onChange={(e) => { setEmail(e.target.value); setError('') }}
          />
        </label>
        <label className="tl-field">
          <span>密碼</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
          />
        </label>
        {error && <p className="tl-error" role="alert">{error}</p>}
        <div className="tl-actions">
          <button type="button" className="hint-btn ghost sm" onClick={onBack}>返回</button>
          <button type="submit" className="hint-btn sm">登入</button>
        </div>
        <button type="button" className="tl-demo" onClick={fillDemoTeacher}>（Demo）填入測試教師帳號</button>
      </form>
    </div>
  )
}
