import { useEffect, useRef, useState } from 'react';
import { avatarColorFor } from '../data.js';
import { ApiError, devCompetition, getCompetition, getGroups, poll, setGroup } from '../../../api/student.js';

/*
  選擇組別（輸入名字之後、進賽場之前）：
  - 組數是老師在「發起競賽」時就設定好的，學生不能自己新增組別，只能選要進哪一組；每組沒有人數上限。
  - 每一組是一個方框；點方框就加入那一組，自己的名字會出現在方框裡。點別組就換過去，也可以「離開這組」。
  - 已經接後端（docs/api-student.md 第 3 節）：每 2 秒更新一次各組名單、同時看老師開始了沒。
    老師開始後（status 不是 waiting），有組的人自動進賽場；遲到、還沒有組的人選好一組就進去。
  - 用 studentId 認自己（同名的同學也分得出來）。
*/
const POLL_MS = 2000;

export default function TeamForm({ myStudentId, onStart, onLost }) {
  const [groups, setGroups] = useState(null); // { groupCount, groups: [{ groupId, members }] }
  const [status, setStatus] = useState('waiting');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  function handleError(err) {
    if (err instanceof ApiError && err.status === 401) { onLost(); return; }
    setError(err.message || '發生錯誤，請稍後再試');
  }

  // 定時更新各組名單、競賽狀態
  useEffect(() => poll(getGroups, (data) => { setGroups(data); setError(''); }, POLL_MS, handleError), []);
  useEffect(() => poll(getCompetition, (c) => setStatus(c.status), POLL_MS, handleError), []);

  const myGroup = groups?.groups.find((g) => g.members.some((m) => m.studentId === myStudentId)) || null;
  const started = status !== 'waiting';

  // 老師開始了、而且自己有組 → 進賽場（只進一次）
  useEffect(() => {
    if (started && myGroup && !startedRef.current) {
      startedRef.current = true;
      onStart();
    }
  }, [started, myGroup]);

  async function choose(groupId) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await setGroup(groupId);
      setGroups(await getGroups()); // 馬上更新，不用等下一次輪詢
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  if (!groups) {
    return (
      <div className="stu-team">
        <div className="stu-team-head"><h2>選擇組別</h2></div>
        <p className="stu-team-empty">{error || '載入中…'}</p>
      </div>
    );
  }

  return (
    <div className="stu-team">
      <div className="stu-team-head">
        <h2>選擇組別</h2>
      </div>

      <div className="stu-team-grid">
        {groups.groups.map((team) => {
          const mine = team === myGroup;
          const body = (
            <>
              <div className="stu-team-box-top">
                <b>第 {team.groupId} 組</b>
                <span className="stu-team-count">{team.members.length} 人</span>
              </div>
              {team.members.length === 0 && <p className="stu-team-empty">還沒有人</p>}
              <ul className="stu-team-members">
                {team.members.map((m) => (
                  <li key={m.studentId} className={m.studentId === myStudentId ? 'is-me' : ''}>
                    <span className="stu-team-avatar" style={{ background: avatarColorFor(m.name) }}>{m.name.charAt(0)}</span>
                    <span className="stu-team-name">{m.name}{m.studentId === myStudentId && '（你）'}</span>
                  </li>
                ))}
              </ul>
            </>
          );
          // 自己所在的組不是按鈕（裡面要放「離開這組」按鈕，按鈕裡不能再放按鈕）
          if (mine) {
            return (
              <div key={team.groupId} className="stu-team-box is-mine">
                {body}
                {!started && (
                  <button type="button" className="stu-team-leave" onClick={() => choose(null)} disabled={busy}>離開這組</button>
                )}
              </div>
            );
          }
          return (
            <button
              key={team.groupId}
              type="button"
              className="stu-team-box"
              onClick={() => choose(team.groupId)}
              disabled={busy}
              aria-label={`第 ${team.groupId} 組，${team.members.map((m) => m.name).join('、') || '還沒有人'}，點擊加入`}
            >
              {body}
            </button>
          );
        })}
      </div>

      <div className="stu-team-foot">
        {error && <p className="stu-form-error" role="alert">{error}</p>}
        <p className={myGroup ? 'is-ready' : ''}>
          {myGroup && `你在第 ${myGroup.groupId} 組（${myGroup.members.length} 人），等待老師開始競賽…`}
          {!myGroup && started && '競賽已經開始了！點一個方框加入，就會直接進入賽場。'}
          {!myGroup && !started && '你還沒有組別：點一個方框加入。'}
        </p>
        {/* 教師端還沒做「開始」之前的測試用：真的把這場競賽改成開始（backend/Routes/dev.js） */}
        {!started && (
          <button
            type="button"
            className="stu-btn stu-btn-ghost stu-btn-sm"
            disabled={!myGroup}
            onClick={() => devCompetition('start').then(() => setStatus('running')).catch(handleError)}
          >
            （Demo）老師開始競賽 → 進入賽場
          </button>
        )}
      </div>
    </div>
  );
}
