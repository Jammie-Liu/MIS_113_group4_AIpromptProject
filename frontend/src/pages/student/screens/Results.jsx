import { useState } from 'react';
import { containsBannedWord } from '../data.js';

const RES_TABS = [
  { id: 'kmap-s', label: '集體知識地圖' },
  { id: 'peer-s', label: '各組互評' },
  { id: 'score-s', label: '我的成績單' },
];

const KMAP_CARDS = [
  { dim: '財務影響量化', dots: [['A', 'var(--d1)'], ['B', 'var(--d2)'], ['C', 'var(--d3)']] },
  { dim: '員工／客戶影響評估', dots: [['D', 'var(--d4)'], ['E', 'var(--team-e)']] },
  { dim: '替代方案比較', dots: [['B', 'var(--d2)'], ['C', 'var(--d3)']] },
  { dim: '執行時程與風險', dots: [] },
  { dim: '倫理／法遵考量', dots: [['A', 'var(--d1)']] },
  { dim: '溝通／揭露策略', dots: [['D', 'var(--d4)']] },
];

const KMAP_LEGEND = [
  ['A 隊', 'var(--d1)'], ['B 隊', 'var(--d2)'], ['C 隊（你的隊伍）', 'var(--d3)'], ['D 隊', 'var(--d4)'], ['E 隊', 'var(--team-e)'],
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
  const [peerCards, setPeerCards] = useState(PEER_CARDS_INIT);
  const [peerInputs, setPeerInputs] = useState({ A: '', D: '' });

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
        <div className="panel">
          <div className="eyebrow">六大解方面向 × 各隊涵蓋狀況</div>
          <div className="stu-kmap" style={{ marginTop: 12 }}>
            {KMAP_CARDS.map((c) => (
              <div className="stu-kmap-card" key={c.dim}>
                <div className="stu-dim">{c.dim}</div>
                <div className="stu-kmap-dots">
                  {c.dots.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>尚無隊伍涵蓋</span>
                  ) : (
                    c.dots.map(([letter, color]) => <div className="stu-kdot" style={{ background: color }} key={letter}>{letter}</div>)
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="stu-kmap-legend">
            {KMAP_LEGEND.map(([label, color]) => (
              <span key={label}><span className="stu-sw" style={{ background: color }} />{label}</span>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'peer-s' && (
        <div>
          {peerCards.map((c) => (
            <div className="stu-peer-card" key={c.team}>
              <div className="stu-peer-top"><span className="stu-team">{c.title}</span><span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.coverage}</span></div>
              <div className="stu-peer-solution">{c.solution}</div>
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
              <div className="stu-peer-comments">
                {c.comments.map((cm, i) => (
                  <div className="stu-peer-comment" key={i}><b>{cm.author}：</b>{cm.text}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'score-s' && (
        <>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ textAlign: 'center' }}>本場競賽前三名（全班可見）</div>
            <div className="stu-podium-wrap">
              <div className="stu-podium-slot"><div className="stu-medal">🥈</div><div className="stu-pteam">A 隊</div><div className="stu-pscore">87.1</div><div className="stu-podium-block stu-podium-silver">2</div></div>
              <div className="stu-podium-slot"><div className="stu-medal">🥇</div><div className="stu-pteam">E 隊</div><div className="stu-pscore">89.2</div><div className="stu-podium-block stu-podium-gold">1</div></div>
              <div className="stu-podium-slot"><div className="stu-medal">🥉</div><div className="stu-pteam">B 隊</div><div className="stu-pscore">84.0</div><div className="stu-podium-block stu-podium-bronze">3</div></div>
            </div>
          </div>
          <div className="stu-score-summary">
            <div className="panel">
              <div className="eyebrow">C 隊（你的隊伍）分數組成</div>
              <div className="stu-score-line"><span className="stu-n">各組互評平均分</span><span className="stu-v">86</span></div>
              <div className="stu-score-line"><span className="stu-n">AI 評分（參考）</span><span className="stu-v">81</span></div>
              <div className="stu-score-line"><span className="stu-n">獨特貢獻加分</span><span className="stu-v">+6</span></div>
              <div className="stu-score-line"><span className="stu-n">幻覺扣分</span><span className="stu-v">−0</span></div>
              <div className="stu-score-line"><span className="stu-n">老師調整</span><span className="stu-v">−8</span></div>
            </div>
            <div className="stu-total-card">
              <div className="stu-num">76.5</div>
              <div className="stu-rank">全班第 4 名 / 共 5 隊</div>
              <div className="stu-privacy-note">未進入前三名的隊伍名次僅該隊自己看得到。你只能看到前三名與自己的成績，看不到其他隊伍（例如 D 隊）的實際排名。</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
