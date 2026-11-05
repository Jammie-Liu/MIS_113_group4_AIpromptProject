import { CLASSMATES, MY_STUDENT_ID, MY_SCORES, MY_PRACTICE_SUMMARY, MY_COMPETITION_SUMMARY, avatarColorFor } from '../data.js';

const DIM_ROWS = [['d1', '委託'], ['d2', '描述'], ['d3', '辨識'], ['d4', '盡責']];

export default function StudentDetail({ studentId, courseId, myName, myEmail, myBio, visibility, onBack }) {
  const s = (CLASSMATES[courseId] || []).find((x) => x.id === studentId);
  const isSelf = !!(s && s.isSelf);
  const name = isSelf ? myName : s.name;
  const vis = isSelf ? visibility : s.visible;
  const bio = isSelf ? myBio : s.bio;
  const scores = isSelf ? MY_SCORES : s.scores;
  const practiceSummary = isSelf ? MY_PRACTICE_SUMMARY : s.practice;
  const competitionSummary = isSelf ? MY_COMPETITION_SUMMARY : s.competition;

  const infoRows = [];
  if (vis.studentId) infoRows.push(['學號', isSelf ? MY_STUDENT_ID : s.studentId]);
  if (vis.email) infoRows.push(['Email', isSelf ? myEmail : s.email]);

  return (
    <>
      <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" style={{ marginBottom: 14 }} onClick={onBack}>← 返回課程</button>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="stu-profile-card">
          <div className="stu-profile-avatar" style={{ background: avatarColorFor(name) }}>{name.charAt(0)}</div>
          <div className="stu-profile-meta">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{name}{isSelf ? '（你）' : ''}</div>
          </div>
        </div>
      </div>

      {vis.bio && bio && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="eyebrow">個人簡介</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--ink)', marginTop: 4 }}>{bio}</div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="eyebrow">基本資料</div>
        <div style={{ marginTop: 4 }}>
          {infoRows.length === 0 ? (
            <div className="stu-sd-empty">這位同學沒有公開其他基本資料。</div>
          ) : (
            infoRows.map(([label, value]) => (
              <div className="stu-sd-row" key={label}><span className="stu-sd-label">{label}</span><span className="stu-sd-value">{value}</span></div>
            ))
          )}
        </div>
      </div>

      {vis.d4 && (
        <div className="panel stu-rt" style={{ marginBottom: 16 }}>
          <div className="eyebrow">4D 能力總覽</div>
          <div className="stu-radar-mini" style={{ marginTop: 10 }}>
            {DIM_ROWS.map(([k, label]) => (
              <div className="stu-row" key={k}>
                <span className="stu-lbl" style={{ color: `var(--${k})` }}>{label}</span>
                <div className="stu-track"><div className="stu-fill" style={{ width: `${scores[k]}%`, background: `var(--${k})` }} /></div>
                <span className="stu-pct">{scores[k]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vis.practice && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="eyebrow">教學面練習紀錄</div>
          <div className="stu-sd-record-line">{practiceSummary}</div>
        </div>
      )}

      {vis.competition && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="eyebrow">競賽面表現紀錄</div>
          <div className="stu-sd-record-line">{competitionSummary}</div>
        </div>
      )}
    </>
  );
}
