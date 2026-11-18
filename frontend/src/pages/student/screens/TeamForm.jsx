import { useEffect, useRef, useState } from 'react';
import { avatarColorFor } from '../data.js';

/*
  自行分組（輸入名字之後、進賽場之前）：
  - 每一組是一個方框。按「＋ 發起新組別」會多一個方框，自己的名字放在裡面（發起人）。
  - 想跟誰同一組，就點那個人所在的方框，自己的名字會從原本的方框移過去。
  - 一組最多 TEAM_SIZE_MAX 人，滿了的方框點不了。
  - 自己發起、又只剩自己一個人的組，離開後方框就消失（空的組沒有意義）。
  還沒接後端：其他同學是假資料，用計時器模擬「陸續有人加入」，讓 demo 看得出畫面會即時更新；
  接後端後改成從伺服器收到分組變動。
*/
const TEAM_SIZE_MAX = 3; // 跟教師端「N 人一組」的預設值一致（docs/system-flow.md）
const INITIAL_TEAMS = [
  { id: 1, members: ['陳柏翰', '林宜蓁'] },
  { id: 2, members: ['黃于軒'] },
];
// 之後陸續進來的假同學：join 表示加入人數最少、還沒滿的組，create 表示自己發起新組
const ARRIVALS = [
  { name: '吳珮瑜', action: 'join' },
  { name: '張家豪', action: 'create' },
  { name: '李思妤', action: 'join' },
];
const ARRIVAL_INTERVAL_MS = 4000;

// 把某人從所有組移除；被移除後沒人的組一起拿掉
function withoutMember(teams, name) {
  return teams
    .map((t) => ({ ...t, members: t.members.filter((m) => m !== name) }))
    .filter((t) => t.members.length > 0);
}

export default function TeamForm({ myName, onStart }) {
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const nextIdRef = useRef(INITIAL_TEAMS.length + 1);

  // 模擬其他同學陸續加入
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      const arrival = ARRIVALS[i];
      i += 1;
      if (!arrival) { clearInterval(timer); return; }
      setTeams((prev) => {
        const open = prev.filter((t) => t.members.length < TEAM_SIZE_MAX);
        if (arrival.action === 'join' && open.length > 0) {
          const target = open.reduce((a, b) => (b.members.length < a.members.length ? b : a));
          return prev.map((t) => (t.id === target.id ? { ...t, members: [...t.members, arrival.name] } : t));
        }
        const id = nextIdRef.current;
        nextIdRef.current += 1;
        return [...prev, { id, members: [arrival.name] }];
      });
    }, ARRIVAL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const myTeamIndex = teams.findIndex((t) => t.members.includes(myName));
  const myTeam = myTeamIndex >= 0 ? teams[myTeamIndex] : null;

  function handleJoin(teamId) {
    setTeams((prev) => {
      const target = prev.find((t) => t.id === teamId);
      if (!target || target.members.includes(myName) || target.members.length >= TEAM_SIZE_MAX) return prev;
      return withoutMember(prev, myName).map((t) => (t.id === teamId ? { ...t, members: [...t.members, myName] } : t));
    });
  }

  function handleCreate() {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setTeams((prev) => [...withoutMember(prev, myName), { id, members: [myName] }]);
  }

  function handleLeave() {
    setTeams((prev) => withoutMember(prev, myName));
  }

  return (
    <div className="stu-team">
      <div className="stu-team-head">
        <h2>選擇組別</h2>
        <p>點一個方框就能加入那一組；想自己找人，就按「發起新組別」。每組最多 {TEAM_SIZE_MAX} 人。</p>
      </div>

      <div className="stu-team-grid">
        {teams.map((team, index) => {
          const mine = team === myTeam;
          const full = team.members.length >= TEAM_SIZE_MAX;
          const body = (
            <>
              <div className="stu-team-box-top">
                <b>第 {index + 1} 組</b>
                <span className="stu-team-count">{team.members.length}/{TEAM_SIZE_MAX} 人</span>
              </div>
              <ul className="stu-team-members">
                {team.members.map((name, i) => (
                  <li key={name} className={name === myName ? 'is-me' : ''}>
                    <span className="stu-team-avatar" style={{ background: avatarColorFor(name) }}>{name.charAt(0)}</span>
                    <span className="stu-team-name">{name}{name === myName && '（你）'}</span>
                    {i === 0 && <em className="stu-team-leader">發起人</em>}
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
              aria-label={`第 ${index + 1} 組，${team.members.join('、')}，${full ? '已滿' : '點擊加入'}`}
            >
              {body}
              <span className="stu-team-cta">{full ? '已滿' : '點擊加入'}</span>
            </button>
          );
        })}

        <button type="button" className="stu-team-box stu-team-create" onClick={handleCreate}>
          <span className="stu-team-create-plus">＋</span>
          <span>發起新組別</span>
        </button>
      </div>

      <div className="stu-team-foot">
        <p className={myTeam ? 'is-ready' : ''}>
          {myTeam
            ? `你在第 ${myTeamIndex + 1} 組（${myTeam.members.length}/${TEAM_SIZE_MAX} 人），等待老師開始競賽…`
            : '你還沒有組別：點一個方框加入，或發起新組別。'}
        </p>
        <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={onStart} disabled={!myTeam}>
          （Demo）老師開始競賽 → 進入賽場
        </button>
      </div>
    </div>
  );
}
