import { useState } from 'react'
import { IconWarning } from '../icons.jsx'
import { TEAM_DETAIL, TEAM_CHAT, PUSH_SUGGESTIONS, TEAMS } from '../data.js'
import { playSuccess } from '../sound.js'

const QUICK_CARDS = PUSH_SUGGESTIONS.map((card) => ({ ...card, title: card.label.split('：')[0] }))

export default function TeamDetail({ teamName, onBack, onToast }) {
  const d = TEAM_DETAIL[teamName]
  const chat = TEAM_CHAT[teamName] || []
  const progress = TEAMS.find((team) => team.name === teamName)
  const [tab, setTab] = useState('chat')
  const [pushTarget, setPushTarget] = useState('team')
  const [pushText, setPushText] = useState('')
  const [pushLog, setPushLog] = useState([])

  const coveredCount = d.coverage.filter((item) => item.ok).length

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
    <div className="arena-screen">
      <button className="hint-btn ghost sm arena-back" onClick={onBack}>← 返回監控台</button>
      <section className="arena-console td-console" aria-label={`${teamName}詳情`}>
        <header className="td-bar" style={{ '--team-color': progress?.dot }}>
          <div className="td-bar-identity">
            <span className="arena-team-mark td-mark">{teamName.slice(0, 1)}</span>
            <div>
              <h2>{teamName}</h2>
              <span className="arena-team-status td-status"><i />{d.status}</span>
            </div>
          </div>
          {progress && (
            <div className="td-stats">
              <div className="td-stat"><span>來回對話</span><b>{progress.exchanges}<small> 次</small></b></div>
              <div className="td-stat"><span>AI 即時評分</span><b>{progress.aiScore}</b></div>
              <div className="td-stat"><span>解方覆蓋率</span><b>{progress.cov}<small>%</small></b></div>
            </div>
          )}
        </header>

        {d.hallucination && (
          <div className="td-alert" role="alert">
            <IconWarning size={16} />
            <div>
              <b>命中幻覺：「{d.hallucination.claim}」</b>
              <span>{d.hallucination.note}</span>
            </div>
          </div>
        )}

        <div className="td-grid">
          <section className="arena-panel td-main" aria-label="隊伍內容">
            <div className="td-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
                對話紀錄 <i>{chat.length}</i>
              </button>
              <button type="button" role="tab" aria-selected={tab === 'solution'} className={tab === 'solution' ? 'active' : ''} onClick={() => setTab('solution')}>
                AI 解方
              </button>
              <button type="button" role="tab" aria-selected={tab === 'coverage'} className={tab === 'coverage' ? 'active' : ''} onClick={() => setTab('coverage')}>
                覆蓋清單 <i>{coveredCount}/{d.coverage.length}</i>
              </button>
            </div>

            <div className="td-tab-body">
              {tab === 'chat' && (
                chat.length === 0 ? <p className="td-empty">這一隊還沒有對話紀錄。</p> : (
                  <ol className="td-chat">
                    {chat.map((turn, idx) => (
                      <li className="td-turn" key={idx}>
                        <div className="td-turn-head">
                          <span className="td-avatar">{turn.who.slice(0, 1)}</span>
                          <b>{turn.who}</b>
                          <time>{turn.at}</time>
                        </div>
                        <div className="td-bubble user">{turn.prompt}</div>
                        <div className={`td-bubble ai${turn.flag === 'halluc' ? ' flagged' : ''}`}>
                          <span className="td-ai-tag">AI{turn.flag === 'halluc' && <em>疑似幻覺</em>}</span>
                          {turn.reply}
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              )}

              {tab === 'solution' && <div className="td-solution">{d.solution}</div>}

              {tab === 'coverage' && (
                <ul className="td-coverage">
                  {d.coverage.map((item, idx) => (
                    <li className={item.ok ? 'ok' : 'no'} key={idx}>
                      <span className="td-cov-mark" aria-label={item.ok ? '已涵蓋' : '未涵蓋'}>{item.ok ? '✓' : '✕'}</span>
                      <div><b>{item.item}</b><span>{item.note}</span></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className="arena-panel td-push" aria-labelledby="push-heading">
            <div className="arena-section-heading compact-heading">
              <div>
                <h3 id="push-heading">發送提示</h3>
                <p>學生會在右下角看到提示條，不會打斷輸入。</p>
              </div>
            </div>

            <div className="td-target" role="radiogroup" aria-label="發送對象">
              <button type="button" role="radio" aria-checked={pushTarget === 'team'} className={pushTarget === 'team' ? 'active' : ''} onClick={() => setPushTarget('team')}>只給此隊</button>
              <button type="button" role="radio" aria-checked={pushTarget === 'all'} className={pushTarget === 'all' ? 'active' : ''} onClick={() => setPushTarget('all')}>全部隊伍</button>
            </div>

            <div className="td-quick">
              {QUICK_CARDS.map((card) => (
                <button type="button" key={card.key} title={card.label} onClick={() => setPushText(card.text)}>{card.title}</button>
              ))}
            </div>

            <textarea
              className="td-textarea"
              placeholder="點上方建議卡自動帶入文字，或自己輸入，送出前都可以再編輯……"
              value={pushText}
              onChange={(e) => setPushText(e.target.value)}
            />
            <button type="button" className="hint-btn td-send" onClick={sendPush} disabled={!pushText.trim()}>送出提示 →</button>

            {pushLog.length > 0 && (
              <ul className="td-log">
                {pushLog.map((item, idx) => (
                  <li key={idx}><b>已送出 → {item.target}</b><span>{item.text}</span></li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
