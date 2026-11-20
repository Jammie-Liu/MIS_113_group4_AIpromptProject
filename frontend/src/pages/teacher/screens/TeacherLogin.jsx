import { useState } from 'react'
import { LogoMark } from '../../landing/Landing.jsx'
import { DEMO_ACCOUNTS, verifyTeacherLogin, registerTeacher } from '../data.js'

/*
  教師登入／註冊：從首頁按「教師」入口進來先到這裡。
  - 登入：驗證通過（帳密正確、而且是教師帳號）才進教師端。
  - 註冊：還沒有帳號的老師按「註冊」切換到註冊表單，註冊成功回到登入、信箱自動帶好。
  版面跟學生端輸入賽場代碼那頁一樣：上方黑色選單列只有 logo，中間一個框，背景是同一套動態背景
  （TeacherApp 的 TeacherBackground）。
  還沒接後端：帳號存在 data.js 的 DEMO_ACCOUNTS，「（Demo）填入測試教師帳號」方便組員測試。
*/
export default function TeacherLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState('login') // 'login' 或 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function switchMode(next) {
    setMode(next)
    setPassword('')
    setConfirm('')
    setError('')
    setNotice('')
  }

  function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('請輸入信箱和密碼'); return }
    const result = verifyTeacherLogin(email, password)
    if (!result.ok) { setError(result.error); return }
    onLogin(result.account)
  }

  function handleRegister(e) {
    e.preventDefault()
    const result = registerTeacher({ name, email, password, confirm })
    if (!result.ok) { setError(result.error); return }
    // 註冊成功：回到登入、信箱帶好，只要再輸入密碼
    setMode('login')
    setEmail(result.account.email)
    setPassword('')
    setConfirm('')
    setError('')
    setNotice('註冊成功，請登入')
  }

  function fillDemoTeacher() {
    const demo = DEMO_ACCOUNTS.find((a) => a.role === 'teacher')
    setEmail(demo.email)
    setPassword(demo.password)
    setError('')
  }

  const clearMsg = () => { setError(''); setNotice('') }

  return (
    <div className="tl-page">
      <header className="landing-nav">
        <a className="landing-logo" href="/" onClick={(e) => { e.preventDefault(); onBack() }}>
          <LogoMark />
          <span>Prompt Master</span>
        </a>
      </header>

      {mode === 'login' ? (
        <form className="tl-card" onSubmit={handleLogin} noValidate key="login">
          <h3>教師登入</h3>
          {notice && <p className="tl-notice" role="status">{notice}</p>}
          <label className="tl-field">
            <span>學校信箱</span>
            <input type="email" autoComplete="username" placeholder="name@school.edu.tw" value={email} autoFocus={!email}
              onChange={(e) => { setEmail(e.target.value); clearMsg() }} />
          </label>
          <label className="tl-field">
            <span>密碼</span>
            <input type="password" autoComplete="current-password" value={password} autoFocus={Boolean(email)}
              onChange={(e) => { setPassword(e.target.value); clearMsg() }} />
          </label>
          {error && <p className="tl-error" role="alert">{error}</p>}
          <div className="tl-actions">
            <button type="button" className="hint-btn ghost sm" onClick={onBack}>返回</button>
            <button type="submit" className="hint-btn sm">登入</button>
          </div>
          <p className="tl-switch">還沒有帳號？<button type="button" onClick={() => switchMode('register')}>註冊</button></p>
          <button type="button" className="tl-demo" onClick={fillDemoTeacher}>（Demo）填入測試教師帳號</button>
        </form>
      ) : (
        <form className="tl-card" onSubmit={handleRegister} noValidate key="register">
          <h3>教師註冊</h3>
          <label className="tl-field">
            <span>姓名</span>
            <input type="text" autoComplete="name" value={name} autoFocus
              onChange={(e) => { setName(e.target.value); clearMsg() }} />
          </label>
          <label className="tl-field">
            <span>學校信箱</span>
            <input type="email" autoComplete="username" placeholder="name@school.edu.tw" value={email}
              onChange={(e) => { setEmail(e.target.value); clearMsg() }} />
          </label>
          <label className="tl-field">
            <span>密碼（至少 8 碼）</span>
            <input type="password" autoComplete="new-password" value={password}
              onChange={(e) => { setPassword(e.target.value); clearMsg() }} />
          </label>
          <label className="tl-field">
            <span>再輸入一次密碼</span>
            <input type="password" autoComplete="new-password" value={confirm}
              onChange={(e) => { setConfirm(e.target.value); clearMsg() }} />
          </label>
          {error && <p className="tl-error" role="alert">{error}</p>}
          <div className="tl-actions">
            <button type="button" className="hint-btn ghost sm" onClick={() => switchMode('login')}>返回登入</button>
            <button type="submit" className="hint-btn sm">註冊</button>
          </div>
          <p className="tl-switch">已經有帳號？<button type="button" onClick={() => switchMode('login')}>登入</button></p>
        </form>
      )}
    </div>
  )
}
