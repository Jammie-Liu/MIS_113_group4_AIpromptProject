import { TEAM_COLORS } from '../data.js'

/*
  一個回合的「改善建議」（docs/scoring-design.md 十二、docs/api-teacher.md 5.7）。監控台的回合之間與結果頁回看都用這個元件。
  內容是競賽評分 AI 依全班這回合的評分結果整理的，以學生使用 4D 的狀況為主，只有老師看得到。
  onUseHint：監控台才傳，按「帶入提示條」把建議的提示條文字帶到編輯框，老師修改後再送；結果頁回看時不傳，只顯示文字。
*/
const teamName = (id) => `${id} 隊`

function Indicators({ list }) {
  if (!list?.length) return null
  return <span className="sg-indicators">{list.map((code) => <i key={code}>{code}</i>)}</span>
}

export default function RoundSuggestion({ suggestion, onUseHint }) {
  const { isFinal, classSummary, teams, watchStudents, hintDrafts, comparedToLastRound, uncertainNote } = suggestion
  return (
    <div className="sg">
      <section className="sg-block">
        <h4>{isFinal ? '整場 4D 總結' : '全班狀況'}</h4>
        <ul className="sg-list">
          {classSummary.map((item) => <li key={item.point}>{item.point}<Indicators list={item.indicators} /></li>)}
        </ul>
      </section>

      {comparedToLastRound?.length > 0 && (
        <section className="sg-block">
          <h4>{isFinal ? '跟第 1 回合比' : '跟上一回合比'}</h4>
          <ul className="sg-list">
            {comparedToLastRound.map((item) => <li key={item.point}>{item.point}</li>)}
          </ul>
        </section>
      )}

      <section className="sg-block">
        <h4>各隊建議</h4>
        <div className="sg-teams">
          {teams.map((team) => (
            <article className="sg-team" key={team.teamId} style={{ '--team-color': TEAM_COLORS[team.teamId] }}>
              <b>{teamName(team.teamId)}</b>
              {team.points.map((p) => (
                <div key={p.issue}>
                  <p>{p.issue}<Indicators list={p.indicators} /></p>
                  <p className="sg-advice">→ {p.suggestion}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      {watchStudents.length > 0 && (
        <section className="sg-block">
          <h4>需要關注的學生</h4>
          <ul className="sg-list">
            {watchStudents.map((s) => <li key={s.studentName}><b>{teamName(s.teamId)}・{s.studentName}</b>：{s.reason}</li>)}
          </ul>
        </section>
      )}

      {hintDrafts.length > 0 && (
        <section className="sg-block">
          <h4>建議提示條<small>寫成引導性問題，不直接給答案；要不要送、送給誰由你決定</small></h4>
          <ul className="sg-hints">
            {hintDrafts.map((text) => (
              <li key={text}>
                <span>{text}</span>
                {onUseHint && <button type="button" onClick={() => onUseHint(text)}>帶入提示條</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {uncertainNote && <p className="sg-uncertain">⚠ {uncertainNote}</p>}
      <p className="sg-foot">由評分 AI 依這回合的評分結果整理，只有老師看得到，不影響分數。</p>
    </div>
  )
}
