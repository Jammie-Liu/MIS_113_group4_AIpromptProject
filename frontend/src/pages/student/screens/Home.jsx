import {
  TIERS, TIER_UNLOCK_N, PROBLEMS,
  completedCountInTier, isTierUnlocked, getPracticeState, continuePracticeProblemId,
} from '../data.js';
import { IconCheck, IconPlay, IconLock, IconEmpty } from '../icons.jsx';

function StatusIcon({ status }) {
  if (status === 'completed') return <span className="stu-prow-status" style={{ color: 'var(--d3)' }}><IconCheck /></span>;
  if (status === 'locked') return <span className="stu-prow-status" style={{ color: 'var(--ink-faint)' }}><IconLock /></span>;
  if (status === 'in-progress') return <span className="stu-prow-status" style={{ color: 'var(--d2)' }}><IconPlay /></span>;
  return <span className="stu-prow-status" style={{ color: 'var(--ink-soft)' }}><IconEmpty /></span>;
}

function TierGroup({ tier, tierIdx, practiceState, onSelectProblem }) {
  const unlocked = isTierUnlocked(practiceState, tier.id);
  const ids = Object.keys(PROBLEMS).filter((id) => PROBLEMS[id].tier === tier.id);

  let progressText;
  if (!unlocked) {
    const prevTier = TIERS[tierIdx - 1];
    const have = completedCountInTier(practiceState, prevTier.id);
    progressText = `完成 ${TIER_UNLOCK_N} 題「${prevTier.label}」後解鎖（目前 ${Math.min(have, TIER_UNLOCK_N)} / ${TIER_UNLOCK_N}）`;
  } else {
    const done = ids.filter((id) => getPracticeState(practiceState, id).status === 'completed').length;
    progressText = `已完成 ${done} / ${ids.length} 題`;
  }

  return (
    <div className={`stu-tier-group${unlocked ? '' : ' stu-tier-group-locked'}`}>
      <div className="stu-tier-head">
        <div className="stu-tier-name">{tier.label}</div>
        <div className="stu-tier-progress">{progressText}</div>
      </div>
      <div className="panel">
        <div className="stu-problem-list">
          {ids.length === 0 ? (
            <div className="stu-placeholder">這個難度目前還沒有題目。</div>
          ) : (
            ids.map((id) => {
              const problem = PROBLEMS[id];
              const status = unlocked ? getPracticeState(practiceState, id).status : 'locked';
              const clickable = unlocked;
              return (
                <div
                  key={id}
                  className={`stu-problem-row${status === 'locked' ? ' stu-problem-row-locked' : ''}${clickable ? ' stu-problem-row-clickable' : ''}`}
                  onClick={clickable ? () => onSelectProblem(id) : undefined}
                >
                  <StatusIcon status={status} />
                  <span className="stu-prow-title">
                    {problem.title}
                    {status === 'in-progress' && <span className="stu-prow-continue">繼續</span>}
                  </span>
                  <span className={`stu-prow-diff stu-diff-${tier.diffClass}`}>{tier.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home({ practiceState, currentProblemId, onSelectProblem }) {
  const continueTargetId = continuePracticeProblemId(practiceState, currentProblemId);

  return (
    <div className="stu-tier-col">
      <button type="button" className="stu-continue-btn" onClick={() => onSelectProblem(continueTargetId)}>
        <span>接續上一次的練習</span>
        <span className="stu-continue-target">{PROBLEMS[continueTargetId].title}</span>
      </button>
      {TIERS.map((tier, idx) => (
        <TierGroup key={tier.id} tier={tier} tierIdx={idx} practiceState={practiceState} onSelectProblem={onSelectProblem} />
      ))}
    </div>
  );
}
