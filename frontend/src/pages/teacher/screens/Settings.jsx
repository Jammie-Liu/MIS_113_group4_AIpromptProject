import { useState } from 'react'
import Modal from '../components/Modal.jsx'
import { UI_SCALES, getUiScaleId, setUiScaleId } from '../uiScale.js'
import { isSoundEnabled, setSoundEnabled, playToggle, SOUND_THEMES, getSoundTheme, setSoundTheme, previewSoundTheme } from '../sound.js'

export default function Settings() {
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [soundTheme, setSoundThemeState] = useState(getSoundTheme())
  const [uiScale, setUiScale] = useState(getUiScaleId())

  function handleSoundToggle(e) {
    const on = e.target.checked
    setSoundOn(on)
    setSoundEnabled(on)
    if (on) playToggle()
  }

  function handleScaleChange(id) {
    setUiScale(id)
    setUiScaleId(id)
  }

  function handleThemeChange(id) {
    setSoundThemeState(id)
    setSoundTheme(id)
    previewSoundTheme(id)
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="profile-card">
          <div className="profile-avatar">張</div>
          <div className="profile-meta">
            <div className="profile-name">張欣綠<span className="profile-role">資訊管理學系 專任教授兼系主任</span></div>
            <div>Email：hjchang@nccu.edu.tw</div>
            <div className="profile-stats">
              <span className="profile-stat"><b>3</b> 門任教課程</span>
              <span className="profile-stat"><b>4</b> 場累計開設競賽</span>
              <span className="profile-stat">加入時間 2026/03/01</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8.3" r="3.4" /><path d="M5 19.5c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5" /></svg>
          帳號設定
        </div>
        <div className="set-row"><div><div className="t">顯示名稱</div></div><input className="set-input" defaultValue="張欣綠" /></div>
        <div className="set-row"><div><div className="t">Email</div></div><input className="set-input" defaultValue="hjchang@nccu.edu.tw" disabled /></div>
        <div className="set-row">
          <div><div className="t">密碼</div></div>
          <button className="hint-btn ghost sm">
            <span className="btn-ic"><svg className="icon-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10.5" width="14" height="9" rx="1.8" /><path d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8" /></svg></span> 修改密碼
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10.5a6 6 0 0 1 12 0v3.3l1.6 2.7H4.4L6 13.8z" /><path d="M9.5 19a2.5 2.5 0 0 0 5 0" /></svg>
          通知設定
        </div>
        <div className="set-row">
          <div><div className="t">停滯隊伍警示通知</div><div className="d">隊伍超過門檻時間無動作時通知我</div></div>
          <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
        </div>
        <div className="set-row">
          <div><div className="t">幻覺命中通知</div><div className="d">任一隊伍命中幻覺陷阱時通知我</div></div>
          <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V9l8-2v9" /><circle cx="7" cy="18" r="2.3" /><circle cx="17" cy="16" r="2.3" /></svg>
          介面效果
        </div>
        <div className="set-row">
          <div><div className="t">畫面大小</div><div className="d">整個教師端的文字與畫面一起放大；要在大投影幕上展示時選「投影」</div></div>
          <div className="sound-themes" role="radiogroup" aria-label="畫面大小">
            {UI_SCALES.map((scale) => (
              <button
                type="button"
                role="radio"
                aria-checked={uiScale === scale.id}
                className={uiScale === scale.id ? 'on' : ''}
                title={scale.desc}
                key={scale.id}
                onClick={() => handleScaleChange(scale.id)}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <div><div className="t">互動音效</div><div className="d">按鈕、頁籤、揭曉名次時播放提示音（支援震動的裝置也會震動）</div></div>
          <label className="switch"><input type="checkbox" checked={soundOn} onChange={handleSoundToggle} /><span className="slider"></span></label>
        </div>
        <div className={`set-row sound-theme-row${soundOn ? '' : ' disabled'}`}>
          <div><div className="t">音效風格</div><div className="d">選一個喜歡的聲音，點一下會先試聽</div></div>
          <div className="sound-themes" role="radiogroup" aria-label="音效風格">
            {SOUND_THEMES.map((t) => (
              <button
                type="button"
                role="radio"
                aria-checked={soundTheme === t.id}
                disabled={!soundOn}
                className={soundTheme === t.id ? 'on' : ''}
                title={t.desc}
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4.2a5 5 0 0 1-10 0z" /><path d="M7 5.2H4.3A2.8 2.8 0 0 0 7 9.5" /><path d="M17 5.2h2.7A2.8 2.8 0 0 1 17 9.5" /><path d="M12 13.2v3" /><path d="M9 20h6" /><path d="M10 16.2h4l.6 3.8H9.4z" /></svg>
          競賽預設值
        </div>
        <div className="set-row">
          <div><div className="t">停滯警示門檻</div><div className="d">隊伍多久無動作即標示停滯</div></div>
          <input className="set-input" style={{ width: 100 }} defaultValue="90 秒" />
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="hint-btn sm danger-btn" onClick={() => setLogoutOpen(true)}>
          <span className="btn-ic"><svg className="icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4.5H6.5A2 2 0 0 0 4.5 6.5v11A2 2 0 0 0 6.5 19.5H9" /><path d="M15.5 16 20 12l-4.5-4" /><path d="M20 12H9.5" /></svg></span> 登出
        </button>
      </div>

      <Modal show={logoutOpen} onClose={() => setLogoutOpen(false)} boxStyle={{ maxWidth: 380, textAlign: 'center' }} labelledBy="logoutModalTitle">
        <div className="modal-head" id="logoutModalTitle" style={{ paddingRight: 0 }}>
          <div className="name">確定要登出嗎？</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8 }}>登出後需要重新輸入帳號密碼才能繼續使用</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button className="hint-btn ghost sm" onClick={() => setLogoutOpen(false)}>取消</button>
          <button className="hint-btn sm danger-btn" onClick={() => setLogoutOpen(false)}>確認登出</button>
        </div>
      </Modal>
    </>
  )
}
