import { useState } from 'react'
import { IconPause, IconPlay, IconCrown } from '../icons.jsx'
import { TEAMS, CONSOLE_KMAP, FIXED_QUESTION_COUNT } from '../data.js'
import { playToggle, playSuccess } from '../sound.js'

function pad(n) { return String(n).padStart(2, '0') }

export default function Arena({ config, onBack, onOpenTeam, onEnd, onToast }) {
  const [isPaused, setIsPaused] = useState(false)
  const [statTime, setStatTime] = useState(() => `${pad(config.timeLimit)}:00`)

  const [mm, ss] = statTime.split(':').map(Number)
  const totalSeconds = mm * 60 + ss
  const lowTime = totalSeconds > 0 && totalSeconds <= 120

  const leadingCov = Math.max(...TEAMS.map((t) => t.cov))

  function togglePause() {
    setIsPaused((v) => !v)
    playToggle()
  }

  function addTime(mins) {
    const total = totalSeconds + mins * 60
    setStatTime(`${pad(Math.floor(total / 60))}:${pad(total % 60)}`)
    onToast(`教師已為全班加時 ${mins} 分鐘，把握機會補齊還沒探索的面向。`)
    playSuccess()
  }

  return (
    <>
      <button className="hint-btn ghost sm" style={{ marginBottom: 14 }} onClick={onBack}>← 返回上一頁</button>
      <div className="console">
        <div className="console-head">
          <div>
            <h2>教師即時監控台</h2>
            <div className="console-sub">
              案例：<span>{config.caseName}</span> · 第 <span>1</span> 題／共 <span>{FIXED_QUESTION_COUNT}</span> 題 · 每題 <span>{config.timeLimit}</span> 分鐘 · 賽場代碼 <span className="mono">{config.code}</span>（分享給學生加入）
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`hint-btn${isPaused ? ' resumed' : ''}`} id="pauseBtn" onClick={togglePause}>
              <span className="btn-ic">{isPaused ? <IconPlay size={14} /> : <IconPause size={14} />}</span> {isPaused ? '恢復競賽' : '暫停競賽'}
            </button>
            <button className="hint-btn end-comp-btn" onClick={onEnd}>結束競賽並前往評分 →</button>
          </div>
        </div>
        <div className={`pause-banner${isPaused ? ' show' : ''}`}>
          <span className="btn-ic"><IconPause size={13} /></span> 競賽已暫停 — 學生端目前無法送出提示
        </div>
        <div className="stat-row">
          <div className={`stat-card time-card${lowTime ? ' low-time' : ''}`}>
            <div className="k">剩餘時間</div>
            <div className="v">{statTime}</div>
            <div className="time-add-row">
              <button className="time-add-btn" title="全班加時 1 分鐘" onClick={() => addTime(1)}>+1 分鐘</button>
              <button className="time-add-btn" title="全班加時 5 分鐘" onClick={() => addTime(5)}>+5 分鐘</button>
            </div>
          </div>
          <div className="stat-card">
            <div className="k">已送出隊伍</div>
            <div className="v">3 / 5</div>
            <div className="submit-dots">
              <span className="dot filled"></span><span className="dot filled"></span><span className="dot filled"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
          <div className="stat-card"><div className="k">全班幻覺命中率</div><div className="v warn">22%</div></div>
          <div className="stat-card"><div className="k">全班偏弱向度</div><div className="v" style={{ color: '#7FD3AE', fontFamily: 'inherit', fontSize: 16 }}>D3 辨識</div></div>
        </div>

        <div className="team-grid">
          {TEAMS.map((t, idx) => {
            const isLeading = t.cov === leadingCov
            return (
              <div
                key={t.name}
                className={`team-card pop-in${t.stalled ? ' stalled' : ''}${t.flagged ? ' flagged' : ''}${isLeading ? ' leading' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => onOpenTeam(t.name)}
              >
                <div className="team-top">
                  <div className="team-name">{isLeading && <IconCrown size={14} />} {t.name}</div>
                  <div className="status-pill"><span className="status-dot" style={{ background: t.dot }}></span>{t.status}</div>
                </div>
                <div className="cov-label">完整解方覆蓋率</div>
                <div className="cov-track"><div className="cov-fill" style={{ width: `${t.cov}%` }}></div></div>
                <div className="team-flags">
                  {t.flags.map((f, i) => <span className={`flag ${f.c}`} key={i}>{f.t}</span>)}
                </div>
                <div className="go">點擊查看完整狀況 →</div>
              </div>
            )
          })}
        </div>

        <div className="push-panel" style={{ background: '#262B45', marginBottom: 18 }}>
          <h3 style={{ color: '#fff' }}>即時集體知識地圖</h3>
          <div className="push-sub">用來判斷該推送哪種引導卡——哪個面向還空著、哪隊已經佔了哪個面向。</div>
          <div className="console-kmap-grid">
            {CONSOLE_KMAP.map((k, i) => (
              <div className={`console-kmap-card${k.empty ? ' empty' : ''}`} key={i}>
                <div className="dim">{k.dim}</div>
                {k.empty ? (
                  <div className="empty-note">尚無隊伍涵蓋 · 建議推送空白區域卡</div>
                ) : (
                  <div className="chips">
                    {k.chips.map((chip, j) => <span className="mm-chip" style={{ background: chip.c }} key={j}>{chip.t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="controls-row"><span className="note">點任一隊伍卡片可查看該隊完整即時狀況並發送提示。</span></div>
      </div>
    </>
  )
}
