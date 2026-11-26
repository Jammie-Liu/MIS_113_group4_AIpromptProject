import { useEffect, useState } from 'react';
import { DEMO_RANKING } from '../data.js';

/*
  競賽結束後先揭曉排名，再進結果頁（像遊戲節目頒獎）：
  0 「競賽結束！」→ 1 第三名升起 → 2 第二名升起 → 3 第一名升起＋彩帶 → 4 顯示自己隊伍的名次和「查看完整結果」。
  每一步用計時器往下走；右上角可以「跳過」直接看到最後。系統設定「減少動態」時一進來就全部顯示。
  名次規則跟結果頁一樣：全班只看得到前三名，自己隊伍的名次只有自己看得到。
  還沒接後端：排名是 data.js 的 DEMO_RANKING。
*/
const STEP_TIMES = [1400, 2900, 4400, 6200]; // 第 1～4 步出現的時間（毫秒）
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

export default function RankingReveal({ onDone }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [step, setStep] = useState(reduceMotion ? 4 : 0);
  const { top3, mine } = DEMO_RANKING;
  const inTop3 = top3.some((t) => t.team === mine.team);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timers = STEP_TIMES.map((ms, i) => setTimeout(() => setStep((s) => Math.max(s, i + 1)), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  // 第三名在 step 1 出現、第二名 step 2、第一名 step 3
  const shownAt = { 3: 1, 2: 2, 1: 3 };
  // 頒獎台左中右：二、一、三
  const order = [2, 1, 3].map((place) => top3.find((t) => t.place === place));

  return (
    <div className="stu-rank-reveal">
      {step < 4 && <button type="button" className="stu-rank-skip" onClick={() => setStep(4)}>跳過 ›</button>}

      <div className="stu-rank-head">
        <p className="stu-rank-kicker">GAME OVER</p>
        <h2>競賽結束！</h2>
        <p className={`stu-rank-sub${step >= 1 ? ' is-hidden' : ''}`}>揭曉前三名…</p>
      </div>

      <div className="stu-rank-podium" aria-live="polite">
        {order.map((t) => {
          const shown = step >= shownAt[t.place];
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

      {step >= 3 && !reduceMotion && (
        <div className="stu-confetti" aria-hidden="true">
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
                ? <>恭喜！<b>{mine.team}</b>（你的隊伍）拿下第 {mine.place} 名</>
                : <><b>{mine.team}</b>（你的隊伍）全班第 <b>{mine.place}</b> 名 / 共 {mine.teamCount} 隊・{mine.score.toFixed(1)} 分</>}
            </p>
            <button type="button" className="stu-btn" onClick={onDone}>查看完整結果 →</button>
          </>
        )}
      </div>
    </div>
  );
}
