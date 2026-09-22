import { useState } from 'react'
import './StudentHome.css'

/*
  這是把原本寫死在 學生端_最初版.html 裡的「首頁 / 遊戲任務地圖」畫面，
  轉成 React 元件的示範。原本 6 個關卡節點是複製貼上 6 段幾乎一樣的 HTML，
  這裡改成用一份資料（LEVELS）搭配 .map() 畫出來 —— 之後要新增/調整
  關卡，只要改資料，不用再複製 HTML。
*/
const LEVELS = [
  { n: 1, side: 'left', status: 'done', stars: '★★★', tag: '初探提問' },
  { n: 2, side: 'right', status: 'done', stars: '★★☆', tag: '進階迭代' },
  { n: 3, side: 'left', status: 'done', stars: '★★★', tag: '幻覺查核' },
  { n: 4, side: 'right', status: 'current', stars: '立即挑戰', tag: '客訴回覆信改寫' },
  { n: 5, side: 'left', status: 'preview', stars: '題庫', tag: '解方發想' },
  { n: 6, side: 'right', status: 'preview', stars: '預覽', tag: '倫理收束' },
]

export default function StudentHome({ onGoArena }) {
  const [streakDays] = useState(6)

  return (
    <div className="home-grid">
      <div className="panel map-panel">
        <div className="map-title">遊戲任務地圖</div>
        <div className="map-sub">這裡是教學面：一關一關解鎖，練習下指令的技巧</div>
        <div className="path">
          {LEVELS.map((level) => (
            <div key={level.n} className={`level ${level.side}`}>
              <div className={`node ${level.status}`}>
                <span className="n">{level.n}</span>
                <span className="stars">{level.stars}</span>
              </div>
              <div className="level-tag">
                {level.tag}
                {level.status === 'preview' && (
                  <>
                    <br />
                    <span className="lock">🔒 demo 可預覽</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side-stack">
        <div className="panel streak-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="streak-mascot">🔥</div>
            <div>
              <div className="eyebrow">連續練習</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>太棒了，繼續保持手感！</div>
            </div>
          </div>
          <div className="num">
            {streakDays}
            <span style={{ fontSize: 13, fontWeight: 400 }}>天</span>
          </div>
        </div>
        <button className="panel arena-cta" onClick={onGoArena}>
          <div className="t">🎮 想挑戰真人團隊競賽？</div>
          <div className="d">點這裡或右下角的小精靈，輸入老師給的賽場代碼即可加入商業兩難競技場。</div>
        </button>
      </div>
    </div>
  )
}
