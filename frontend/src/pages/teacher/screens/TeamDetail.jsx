import { useState } from 'react'
import { TEAM_DETAIL, TEAM_CHAT, PUSH_SUGGESTIONS, TEAMS, KMAP_INITIAL, OFFICIAL_DIMS, teamCoverage } from '../data.js'
import { playSuccess } from '../sound.js'

const QUICK_CARDS = PUSH_SUGGESTIONS.map((card) => ({ ...card, title: card.label.split('：')[0] }))

/*
  隊伍詳情：競賽中不做即時評分，所以這裡沒有 AI 分數與幻覺判斷。
  「最終回答」是組內匿名投票選出的那位組員的個人結果（不是 AI 整合的），投票完成前不會有；
  「已談到的面向」來自即時知識地圖（面向偵測 AI，只看有沒有談到），不是正式評分。
*/

export default function TeamDetail({ teamName, onBack, onToast }) {
  const d = TEAM_DETAIL[teamName]
  const chat = TEAM_CHAT[teamName] || []
  const progress = TEAMS.find((team) => team.name === teamName)
  const letter = teamName.slice(0, 1)
  const officialNodes = OFFICIAL_DIMS.map((dim) => KMAP_INITIAL.find((node) => node.dim === dim) ?? { dim, teams: [], answers: {} })
  const teamNodes = KMAP_INITIAL.filter((node) => node.origin === 'team' && node.teams.includes(letter))
  const coverage = [...officialNodes, ...teamNodes].map((node) => ({ dim: node.dim, origin: node.origin, answer: node.answers[letter] ?? null }))
  const [tab, setTab] = useState('chat')
  const [pushTarget, setPushTarget] = useState('team')
  const [pushText, setPushText] = useState('')
  const [pushLog, setPushLog] = useState([])

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
              <div className="td-stat"><span>已提交</span><b>{progress.submitted}<small> / {progress.members} 人</small></b></div>
              <div className="td-stat"><span>解方覆蓋率（即時）</span><b>{teamCoverage(KMAP_INITIAL, letter)}<small>%</small></b></div>
            </div>
          )}
        </header>

        <div className="td-grid">
          <section className="arena-panel td-main" aria-label="隊伍內容">
            <div className="td-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
                對話紀錄 <i>{chat.length}</i>
              </button>
              <button type="button" role="tab" aria-selected={tab === 'solution'} className={tab === 'solution' ? 'active' : ''} onClick={() => setTab('solution')}>
                最終回答
              </button>
              <button type="button" role="tab" aria-selected={tab === 'coverage'} className={tab === 'coverage' ? 'active' : ''} onClick={() => setTab('coverage')}>
                已談到的面向
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
                        <div className="td-bubble ai">
                          <span className="td-ai-tag">AI</span>
                          {turn.reply}
                        </div>
                      </li>
                    ))}
                  </ol>
                )
              )}

              {tab === 'solution' && (
                d.finalAnswer ? (
                  <>
                    <p className="td-note">組內匿名投票（每人可以勾選多份），{d.finalAnswer.totalVotes} 人中有 {d.finalAnswer.votes} 人勾選 <b>{d.finalAnswer.who}</b> 的個人結果，得票最高，成為這一隊的最終回答。</p>
                    <div className="td-solution">{d.finalAnswer.text}</div>
                  </>
                ) : <p className="td-empty">組內投票還沒完成。回合結束後，組內匿名投票選出一位組員的個人結果，才會出現在這裡。</p>
              )}

              {tab === 'coverage' && (
                <>
                  <p className="td-note">來自即時集體知識地圖：面向偵測 AI 每 1～2 分鐘看一次這隊的對話，只判斷有沒有談到，不是正式評分。</p>
                  <ul className="td-coverage">
                    {coverage.map((item) => (
                      <li className={item.answer ? 'ok' : 'no'} key={item.dim}>
                        <span className="td-cov-mark" aria-label={item.answer ? '已談到' : '還沒談到'}>{item.answer ? '✓' : '✕'}</span>
                        <div>
                          <b>{item.dim}{item.origin === 'team' && <small>（可能的新面向）</small>}</b>
                          <span>{item.answer ? `${item.answer.who}：${item.answer.text}` : '還沒談到'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
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
