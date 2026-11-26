import { useState } from 'react'
import { UI_SCALES, getUiScaleId, setUiScaleId } from '../uiScale.js'
import { isSoundEnabled, setSoundEnabled, playToggle, SOUND_THEMES, getSoundTheme, setSoundTheme, previewSoundTheme } from '../sound.js'

/*
  設定：通知、介面效果、競賽預設值。從右上角頭像選單的「設定」進來；
  「帳號資訊」是另一頁（screens/Account.jsx），登出在頭像選單最下面。
  2026-11-26 拿掉每個設定項目底下的灰色說明文字，只留項目名稱。
*/
export default function Settings() {
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
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10.5a6 6 0 0 1 12 0v3.3l1.6 2.7H4.4L6 13.8z" /><path d="M9.5 19a2.5 2.5 0 0 0 5 0" /></svg>
          通知設定
        </div>
        <div className="set-row">
          <div><div className="t">停滯隊伍警示通知</div></div>
          <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow with-icon">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V9l8-2v9" /><circle cx="7" cy="18" r="2.3" /><circle cx="17" cy="16" r="2.3" /></svg>
          介面效果
        </div>
        <div className="set-row">
          <div><div className="t">畫面大小</div></div>
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
          <div><div className="t">互動音效</div></div>
          <label className="switch"><input type="checkbox" checked={soundOn} onChange={handleSoundToggle} /><span className="slider"></span></label>
        </div>
        <div className={`set-row sound-theme-row${soundOn ? '' : ' disabled'}`}>
          <div><div className="t">音效風格</div></div>
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
          <div><div className="t">停滯警示門檻</div></div>
          <input className="set-input" style={{ width: 100 }} defaultValue="90 秒" />
        </div>
      </div>
    </>
  )
}
