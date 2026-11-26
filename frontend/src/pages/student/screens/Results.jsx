import { useState } from 'react';
import { containsBannedWord, ARENA_CASE, DEMO_RANKING } from '../data.js';
// 全班答案沿用教師端結果頁的集體知識地圖（同一個元件、同一份 demo 隊伍資料），
// 樣式在 teacher.css 的 .fk 系列；之後接後端時兩邊改吃同一支 API
import FinalKnowledgeMap from '../../teacher/components/FinalKnowledgeMap.jsx';
import { RESULT_TEAMS } from '../../teacher/data.js';

const RES_TABS = [
  { id: 'kmap-s', label: '全班答案' },
  { id: 'peer-s', label: '各組互評' },
  { id: 'score-s', label: '我的成績單' },
];

const PEER_CARDS_INIT = [
  {
    team: 'A', title: 'A 隊的完整解方', coverage: '覆蓋率 83%',
    solution: '建議一：立即終止與現供應商的合約，改與通過我們稽核標準的新供應商簽約。\n預估影響：前三個月因交接與磨合，物流成本上升約 15%，但可避免持續的勞動爭議聲量擴大。\n建議二：要求新供應商簽署附帶罰則的勞動條件承諾書，並由第三方每季稽核一次。\n風險：更換供應商本身需要 4-6 週的過渡期，這段期間可能出現交貨延遲。\n（本隊尚未評估員工與現有供應商窗口的關係維護，這部分後續需要 HR 與採購共同討論。）',
    comments: [{ author: 'B 隊', text: '稽核機制的想法很扎實，但沒看到員工端的溝通配套。' }],
  },
  {
    team: 'D', title: 'D 隊的完整解方', coverage: '覆蓋率 71%（含 1 項幻覺紀錄）',
    solution: '建議：維持現供應商，但要求對方在 30 天內提出改善計畫，並加派稽核人力。\n根據我們查到的資料，該產業平均違規率達 42%，顯示這類問題相當普遍，貿然更換供應商不見得能徹底解決問題。\n若供應商未能在期限內改善，才考慮啟動備援供應商評估。\n（註：此段引用的「產業平均違規率 42%」經後台查核為無法找到原始來源，屬幻覺內容，已列入本隊本輪扣分紀錄。）',
    comments: [],
  },
];

export default function Results({ showToast }) {
  const [activeTab, setActiveTab] = useState('kmap-s');
  // 成績單：解方排名、4D 排名切換（跟排名揭曉畫面一樣）
  const [rankKind, setRankKind] = useState('solution');
  const ranking = DEMO_RANKING[rankKind];
  const [peerCards, setPeerCards] = useState(PEER_CARDS_INIT);
  const [peerInputs, setPeerInputs] = useState({ A: '', D: '' });
  // 各組互評沿用教師端評分作業的折疊區塊（rs-acc）和留言樣式；預設展開第一隊
  const [openPeer, setOpenPeer] = useState(() => [PEER_CARDS_INIT[0].team]);

  function togglePeer(team) {
    setOpenPeer((prev) => (prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]));
  }

  function handleAddComment(team) {
    const val = (peerInputs[team] || '').trim();
    if (!val) return;
    if (containsBannedWord(val)) { showToast('內容包含不適當字詞，請修改後再送出。'); return; }
    setPeerCards((prev) => prev.map((c) => (c.team === team ? { ...c, comments: [...c.comments, { author: 'C 隊（你）', text: val }] } : c)));
    setPeerInputs((prev) => ({ ...prev, [team]: '' }));
  }

  return (
    <>
      <div className="stu-res-tabs">
        {RES_TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={`stu-res-tab${activeTab === t.id ? ' stu-res-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'kmap-s' && (
        <div className="panel stu-res-kmap">
          <FinalKnowledgeMap teams={RESULT_TEAMS} caseName={ARENA_CASE.tag} showPresent={false} />
        </div>
      )}

      {activeTab === 'peer-s' && (
        <div className="stu-peer-list">
          {peerCards.map((c) => {
            const open = openPeer.includes(c.team);
            return (
              <section className={`rs-acc${open ? ' open' : ''}`} key={c.team}>
                <button type="button" className="rs-acc-head" aria-expanded={open} aria-controls={`stu-peer-${c.team}`} onClick={() => togglePeer(c.team)}>
                  <span className="rs-acc-title">{c.title}</span>
                  <span className="rs-acc-summary">{c.coverage}・{c.comments.length} 則留言</span>
                  <svg className="rs-acc-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {open && (
                  <div className="rs-acc-body" id={`stu-peer-${c.team}`}>
                    <div className="stu-peer-solution">{c.solution}</div>
                    <p className="rs-vote-note">各組留給這一隊的文字評論，只是回饋，不計分。</p>
                    {c.comments.length > 0 && (
                      <ul className="rs-comments">
                        {c.comments.map((cm, i) => (
                          <li key={i}>
                            <span className="rs-peer-from">{cm.author}</span>
                            <p>{cm.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="stu-peer-input">
                      <input
                        type="text"
                        placeholder={`留言給 ${c.team} 隊……`}
                        value={peerInputs[c.team] || ''}
                        onChange={(e) => setPeerInputs((prev) => ({ ...prev, [c.team]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(c.team); }}
                      />
                      <button type="button" className="stu-btn stu-btn-sm" onClick={() => handleAddComment(c.team)}>送出</button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {activeTab === 'score-s' && (
        <>
          <div className="stu-res-tabs stu-rank-tabs" role="tablist" aria-label="切換排名" style={{ margin: '0 auto 16px' }}>
            {['solution', 'fourD'].map((k) => (
              <button
                type="button"
                role="tab"
                aria-selected={rankKind === k}
                className={`stu-res-tab${rankKind === k ? ' stu-res-tab-active' : ''}`}
                key={k}
                onClick={() => setRankKind(k)}
              >
                {DEMO_RANKING[k].label}
              </button>
            ))}
          </div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ textAlign: 'center' }}>本場競賽{ranking.label}前三名（全班可見）</div>
            <div className="stu-podium-wrap">
              {/* 跟排名揭曉畫面共用 DEMO_RANKING；左中右排成二、一、三 */}
              {[2, 1, 3].map((place) => {
                const t = ranking.top3.find((x) => x.place === place);
                const look = { 1: ['🥇', 'gold'], 2: ['🥈', 'silver'], 3: ['🥉', 'bronze'] }[place];
                return (
                  <div className="stu-podium-slot" key={place}>
                    <div className="stu-medal">{look[0]}</div><div className="stu-pteam">{t.team}</div><div className="stu-pscore">{t.score.toFixed(1)}</div>
                    <div className={`stu-podium-block stu-podium-${look[1]}`}>{place}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="stu-score-summary">
            <div className="panel">
              <div className="eyebrow">{ranking.mine.team}（你的隊伍）{ranking.label}分數組成</div>
              {ranking.breakdown.map(([name, value]) => (
                <div className="stu-score-line" key={name}><span className="stu-n">{name}</span><span className="stu-v">{value}</span></div>
              ))}
            </div>
            <div className="stu-total-card">
              <div className="stu-num">{ranking.mine.score.toFixed(1)}</div>
              <div className="stu-rank">{ranking.label}全班第 {ranking.mine.place} 名 / 共 {ranking.mine.teamCount} 隊</div>
              <div className="stu-privacy-note">未進入前三名的隊伍名次僅該隊自己看得到。你只能看到前三名與自己的成績，看不到其他沒進前三名隊伍的實際排名。</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
