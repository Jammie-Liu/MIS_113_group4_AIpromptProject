import { useState } from 'react'
import { IconUser, IconCheck, IconWarning } from '../icons.jsx'
import { TEAM_DETAIL, PUSH_SUGGESTIONS } from '../data.js'
import { playSuccess } from '../sound.js'

export default function TeamDetail({ teamName, onBack, onToast }) {
  const d = TEAM_DETAIL[teamName]
  const [pushTarget, setPushTarget] = useState('team')
  const [pushText, setPushText] = useState('')
  const [pushLog, setPushLog] = useState([])

  const topPrompt = d.prompts.find((p) => p.rep) || [...d.prompts].sort((a, b) => b.votes - a.votes)[0]

  function sendPush() {
    const txt = pushText.trim()
    if (!txt) return
    const targetLabel = pushTarget === 'all' ? '全部隊伍' : teamName
    setPushLog((log) => [{ target: targetLabel, text: txt }, ...log])
    onToast(txt)
    setPushText('')
    playSuccess()
  }

  return (
    <>
      <div className="td-head">
        <div>
          <button className="hint-btn ghost sm" style={{ marginBottom: 8 }} onClick={onBack}>← 返回上一頁</button>
          <h2>{teamName}</h2>
          <div className="mono" style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{d.status}</div>
        </div>
      </div>

      <div className="td-layout">
        <div className="panel">
          <div className="eyebrow">本輪最高票提示（代表提示）</div>
          {topPrompt && (
            <div className="prompt-log-item rep">
              <div className="top">
                <span><IconUser size={13} /> {topPrompt.who} · <IconCheck size={12} /> 本輪代表提示</span>
                <span>4D {topPrompt.score} · 得票 {topPrompt.votes}</span>
              </div>
              <div className="txt">{topPrompt.txt}</div>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="eyebrow">AI 本輪解方全文</div>
          <div className="solution-block">{d.solution}</div>
        </div>
      </div>

      <div className="td-section-label teacher-only">
        <span className="btn-ic">
          <svg className="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10.5" width="14" height="9" rx="1.8" /><path d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8" /></svg>
        </span> 教師專屬資訊 — 學生看不到這一區的內容
      </div>
      <div className="td-layout">
        <div className="side-stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="eyebrow">完整解方覆蓋清單（AI 評審逐項判定，含理由）</div>
            <div>
              {d.coverage.map((c, i) => (
                <div className="cov-detail-row" key={i}>
                  <span className={`mk ${c.ok ? 'ok' : 'no'}`}>{c.ok ? '✓' : '✕'}</span>
                  <div><div>{c.item}</div><div className="note">{c.note}</div></div>
                </div>
              ))}
            </div>
            {d.hallucination && (
              <div className="hallu-box">
                <b><IconWarning size={14} /> 幻覺紀錄：</b>「{d.hallucination.claim}」<br />{d.hallucination.note}
              </div>
            )}
          </div>
        </div>
        <div className="push-panel">
          <h3>發送提示</h3>
          <div className="push-sub">系統提供建議提示，也可以手動輸入。發送後會出現在該隊學生畫面右下角（不打斷輸入）。</div>
          <div className="target-row">
            <label><input type="radio" name="pushTarget" checked={pushTarget === 'team'} onChange={() => setPushTarget('team')} /> 只給此隊</label>
            <label><input type="radio" name="pushTarget" checked={pushTarget === 'all'} onChange={() => setPushTarget('all')} /> 發送給全部隊伍</label>
          </div>
          <div className="push-suggest">
            {PUSH_SUGGESTIONS.map((s) => (
              <button key={s.key} onClick={() => setPushText(s.text)}>{s.label}</button>
            ))}
          </div>
          <textarea
            className="pushtext"
            placeholder="輸入或點選上方建議卡自動帶入文字，送出前都可以再編輯……"
            value={pushText}
            onChange={(e) => setPushText(e.target.value)}
          />
          <button className="hint-btn sm" onClick={sendPush}>送出提示 →</button>
          <div className="push-log">
            {pushLog.map((item, i) => (
              <div className="push-log-item" key={i}><b>已送出 → {item.target}：</b>{item.text}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
