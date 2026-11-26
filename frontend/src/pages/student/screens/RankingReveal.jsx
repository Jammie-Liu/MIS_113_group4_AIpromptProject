import { useEffect, useState } from 'react';
import { DEMO_RANKING } from '../data.js';

/*
  競賽結束後先揭曉排名，再進結果頁（像遊戲節目頒獎）。解方排名、4D 排名分開，上面用切換鈕切換：
  - 一進來先揭曉解方排名：0「競賽結束！」→ 1 第三名升起 → 2 第二名升起 → 3 第一名升起＋彩帶 → 4 顯示自己隊伍名次
  - 第一次切到另一個排名，那個排名也從頭揭曉一次；已經揭曉過的排名切回去直接顯示結果
  - 右上角「跳過」把目前這個排名直接跳到最後；系統設定減少動態時兩個排名都直接顯示
  名次規則跟結果頁一樣：全班只看得到前三名，自己隊伍的名次只有自己看得到。
  還沒接後端：排名是 data.js 的 DEMO_RANKING。
*/
const KINDS = ['solution', 'fourD'];
const STEP_TIMES = [1400, 2900, 4400, 6200]; // 一開始（還有「競賽結束！」）第 1～4 步出現的時間（毫秒）
const SWITCH_STEP_TIMES = [500, 2000, 3500, 5300]; // 切到還沒揭曉的排名時，不用再等標題，快一點開始
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const CONFETTI_COLORS = ['#00F0FF', '#A78BFF', '#FFC857', '#FF7A8E', '#5CFFB1'];
// 彩帶：位置、顏色、延遲、旋轉都先算好固定下來，重新渲染時不會亂跳
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: ((i * 13) % 10) / 10,
  duration: 2.2 + ((i * 7) % 10) / 10,
  rotate: (i * 47) % 360,
}));
// 第三名在 step 1 出現、第二名 step 2、第一名 step 3；頒獎台左中右排成二、一、三
const SHOWN_AT = { 3: 1, 2: 2, 1: 3 };

export default function RankingReveal({ onDone }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [kind, setKind] = useState('solution');
  // 兩個排名各自記到揭曉到第幾步
  const [steps, setSteps] = useState(reduceMotion ? { solution: 4, fourD: 4 } : { solution: 0, fourD: 0 });
  const [switched, setSwitched] = useState(false); // 切換過之後，還沒揭曉的排名用比較短的節奏
  const [confetti, setConfetti] = useState(null); // 正在灑彩帶的是哪個排名；只有剛揭曉第一名時灑，切回已揭曉的排名不再灑
  const step = steps[kind];
  const ranking = DEMO_RANKING[kind];
  const { top3, mine } = ranking;
  const inTop3 = top3.some((t) => t.team === mine.team);

  // 目前這個排名還沒揭曉完，就排好接下來每一步的時間；切走時清掉，切回來從頭揭曉
  useEffect(() => {
    if (steps[kind] >= 4) return undefined;
    const times = switched ? SWITCH_STEP_TIMES : STEP_TIMES;
    const timers = times.map((ms, i) => setTimeout(() => {
      setSteps((s) => ({ ...s, [kind]: Math.max(s[kind], i + 1) }))
      if (i === 2) setConfetti(kind) // 第一名升起
    }, ms));
    return () => timers.forEach(clearTimeout);
    // 只在換排名時重新排時間；steps 每一步更新不用重排
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  function switchTo(next) {
    if (next === kind) return;
    setSwitched(true);
    setConfetti(null);
    // 還沒揭曉完的排名切回去要從頭來
    setSteps((s) => (s[next] >= 4 ? s : { ...s, [next]: 0 }));
    setKind(next);
  }

  const order = [2, 1, 3].map((place) => top3.find((t) => t.place === place));

  return (
    <div className="stu-rank-reveal">
      {step < 4 && <button type="button" className="stu-rank-skip" onClick={() => setSteps((s) => ({ ...s, [kind]: 4 }))}>跳過 ›</button>}

      <div className="stu-rank-head">
        <p className="stu-rank-kicker">GAME OVER</p>
        <h2>競賽結束！</h2>
        <div className="stu-res-tabs stu-rank-tabs" role="tablist" aria-label="切換排名">
          {KINDS.map((k) => (
            <button
              type="button"
              role="tab"
              aria-selected={kind === k}
              className={`stu-res-tab${kind === k ? ' stu-res-tab-active' : ''}`}
              key={k}
              onClick={() => switchTo(k)}
            >
              {DEMO_RANKING[k].label}
            </button>
          ))}
        </div>
        <p className={`stu-rank-sub${step >= 1 ? ' is-hidden' : ''}`}>揭曉{ranking.label}前三名…</p>
      </div>

      {/* key 換排名就重新掛載：還沒揭曉的排名柱子會從 0 長起來 */}
      <div className="stu-rank-podium" aria-live="polite" key={kind}>
        {order.map((t) => {
          const shown = step >= SHOWN_AT[t.place];
          return (
            <div className={`stu-rank-slot place-${t.place}${shown ? ' is-shown' : ''}`} key={t.place}>
              <div className="stu-rank-info" aria-hidden={!shown}>
                <div className="stu-rank-medal">{MEDALS[t.place]}</div>
                <div className="stu-rank-team">{t.team}</div>
                <div className="stu-rank-score">{t.score.toFixed(1)}</div>
              </div>
              <div className="stu-rank-block"><span>{t.place}</span></div>
            </div>
          );
        })}
      </div>

      {confetti === kind && !reduceMotion && (
        <div className="stu-confetti" aria-hidden="true" key={`confetti-${kind}`}>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`, '--r': `${c.rotate}deg` }}
            />
          ))}
        </div>
      )}

      <div className={`stu-rank-mine${step >= 4 ? ' is-shown' : ''}`}>
        {step >= 4 && (
          <>
            <p>
              {inTop3
                ? <>恭喜！<b>{mine.team}</b>（你的隊伍）拿下{ranking.label}第 <b>{mine.place}</b> 名・{mine.score.toFixed(1)} 分</>
                : <><b>{mine.team}</b>（你的隊伍）{ranking.label}全班第 <b>{mine.place}</b> 名 / 共 {mine.teamCount} 隊・{mine.score.toFixed(1)} 分</>}
            </p>
            <button type="button" className="stu-btn" onClick={onDone}>查看完整結果 →</button>
          </>
        )}
      </div>
    </div>
  );
}
