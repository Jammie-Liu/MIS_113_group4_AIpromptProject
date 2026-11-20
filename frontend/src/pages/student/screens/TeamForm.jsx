import { useEffect, useState } from 'react';
import { avatarColorFor } from '../data.js';

/*
  選擇組別（輸入名字之後、進賽場之前）：
  - 組數和每組人數是老師在「發起競賽」時就設定好的，學生不能自己新增組別，只能選要進哪一組。
  - 每一組是一個方框；點方框就加入那一組，自己的名字會出現在方框裡。點別組就換過去，也可以「離開這組」。
  - 一組最多 TEAM_SIZE_MAX 人，滿了的方框點不了。
  還沒接教師端／後端：組數、人數上限、其他同學都是假資料，用計時器模擬「陸續有人加入」，
  讓 demo 看得出畫面會即時更新；之後改成讀老師的設定、從伺服器收到分組變動。
*/
const TEAM_COUNT = 4; // 假資料：老師設定 4 組
const TEAM_SIZE_MAX = 3; // 假資料：老師設定每組 3 人（教師端「N 人一組」的預設值）
const INITIAL_MEMBERS = { 1: ['陳柏翰', '林宜蓁'], 2: ['黃于軒'] };
const INITIAL_TEAMS = Array.from({ length: TEAM_COUNT }, (_, i) => ({ id: i + 1, members: INITIAL_MEMBERS[i + 1] || [] }));
// 之後陸續進來的假同學，加入人數最少、還沒滿的組
const ARRIVALS = ['吳珮瑜', '張家豪', '李思妤'];
const ARRIVAL_INTERVAL_MS = 4000;

// 把某人從所有組移除（組別是老師設定的，就算沒人了方框也留著）
function withoutMember(teams, name) {
  return teams.map((t) => ({ ...t, members: t.members.filter((m) => m !== name) }));
}

export default function TeamForm({ myName, onStart }) {
  const [teams, setTeams] = useState(INITIAL_TEAMS);

  // 模擬其他同學陸續加入
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      const name = ARRIVALS[i];
      i += 1;
      if (!name) { clearInterval(timer); return; }
      setTeams((prev) => {
        const open = prev.filter((t) => t.members.length < TEAM_SIZE_MAX);
        if (open.length === 0) return prev;
        const target = open.reduce((a, b) => (b.members.length < a.members.length ? b : a));
        return prev.map((t) => (t.id === target.id ? { ...t, members: [...t.members, name] } : t));
      });
    }, ARRIVAL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const myTeam = teams.find((t) => t.members.includes(myName)) || null;

  function handleJoin(teamId) {
    setTeams((prev) => {
      const target = prev.find((t) => t.id === teamId);
      if (!target || target.members.includes(myName) || target.members.length >= TEAM_SIZE_MAX) return prev;
      return withoutMember(prev, myName).map((t) => (t.id === teamId ? { ...t, members: [...t.members, myName] } : t));
    });
  }

  function handleLeave() {
    setTeams((prev) => withoutMember(prev, myName));
  }

  return (
    <div className="stu-team">
      <div className="stu-team-head">
        <h2>選擇組別</h2>
      </div>

      <div className="stu-team-grid">
        {teams.map((team) => {
          const mine = team === myTeam;
          const full = team.members.length >= TEAM_SIZE_MAX;
          const body = (
            <>
              <div className="stu-team-box-top">
                <b>第 {team.id} 組</b>
                <span className="stu-team-count">{team.members.length}/{TEAM_SIZE_MAX} 人</span>
              </div>
              {team.members.length === 0 && <p className="stu-team-empty">還沒有人</p>}
              <ul className="stu-team-members">
                {team.members.map((name) => (
                  <li key={name} className={name === myName ? 'is-me' : ''}>
                    <span className="stu-team-avatar" style={{ background: avatarColorFor(name) }}>{name.charAt(0)}</span>
                    <span className="stu-team-name">{name}{name === myName && '（你）'}</span>
                  </li>
                ))}
              </ul>
            </>
          );
          // 自己所在的組不是按鈕（裡面要放「離開這組」按鈕，按鈕裡不能再放按鈕）
          if (mine) {
            return (
              <div key={team.id} className="stu-team-box is-mine">
                {body}
                <button type="button" className="stu-team-leave" onClick={handleLeave}>離開這組</button>
              </div>
            );
          }
          return (
            <button
              key={team.id}
              type="button"
              className={`stu-team-box${full ? ' is-full' : ''}`}
              onClick={() => handleJoin(team.id)}
              disabled={full}
              aria-label={`第 ${team.id} 組，${team.members.join('、') || '還沒有人'}，${full ? '已滿' : '點擊加入'}`}
            >
              {body}
              {full && <span className="stu-team-cta">已滿</span>}
            </button>
          );
        })}
      </div>

      <div className="stu-team-foot">
        <p className={myTeam ? 'is-ready' : ''}>
          {myTeam
            ? `你在第 ${myTeam.id} 組（${myTeam.members.length}/${TEAM_SIZE_MAX} 人），等待老師開始競賽…`
            : '你還沒有組別：點一個方框加入。'}
        </p>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onStart} disabled={!myTeam}>
          （Demo）老師開始競賽 → 進入賽場
        </button>
      </div>
    </div>
  );
}
