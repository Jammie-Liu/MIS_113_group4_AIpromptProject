// 首頁背景：全部用 SVG 畫，沒有外部圖片。座標以 1214×616 為準，由 preserveAspectRatio 縮放裁切
const WIDTH = 1214;
const HEIGHT = 616;

const CUBE = {
  verts: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
  faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]],
};
const GEM = {
  verts: [[0, -1.35, 0], [0, 1.35, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]],
  faces: [[0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2], [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]],
};

const HUD_INFO = ['MODEL: PROMPT-X', 'PARAMS: 1.6T', 'CONTEXT: 128K', 'STATUS: ONLINE'];
const HUD_OUTPUTS = [['TEXT', 46], ['IMAGE', 30], ['CODE', 40], ['AUDIO', 56], ['VIDEO', 34]];
const HUD_LAYERS = [['LAYER 1', 1024], ['LAYER 2', 2048], ['LAYER 3', 4096], ['LAYER 4', 2048], ['LAYER 5', 1024]];
const HUD_MOTTO = [['HUMAN', 386], ['AI', 426], ['TOGETHER', 466], ['FURTHER', 492]];

// 固定種子的亂數：每次重新渲染，星點和網路的位置都一樣
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

// 把 3D 頂點依序繞 X、Y、Z 軸旋轉，畫的時候直接取 x、y（正投影），z 用來判斷前後
function rotate([x, y, z], [ax, ay, az]) {
  const y1 = y * Math.cos(ax) - z * Math.sin(ax);
  const z1 = y * Math.sin(ax) + z * Math.cos(ax);
  const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
  const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
  return [x2 * Math.cos(az) - y1 * Math.sin(az), x2 * Math.sin(az) + y1 * Math.cos(az), z2];
}

// 在球面上均勻撒點（費氏球面），只留朝前的半球，再把每個點連到最近的三個點
function buildNetwork(cx, cy, radius, count) {
  const rand = seededRandom(7);
  const nodes = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - ((i + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = i * 2.39996 + rand() * 0.4;
    const z = Math.sin(theta) * ring;
    if (z > -0.15) nodes.push({ x: cx + Math.cos(theta) * ring * radius, y: cy + y * radius, z });
  }
  const links = [];
  nodes.forEach((node, index) => {
    nodes
      .map((other, otherIndex) => ({ otherIndex, dist: Math.hypot(other.x - node.x, other.y - node.y) }))
      .filter((item) => item.otherIndex !== index)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .forEach((item) => links.push([node, nodes[item.otherIndex]]));
  });
  return { nodes, links };
}

function buildStars(count) {
  const rand = seededRandom(23);
  return Array.from({ length: count }, () => ({
    x: rand() * WIDTH,
    y: rand() * HEIGHT,
    r: 0.4 + rand() * 1.1,
    opacity: 0.2 + rand() * 0.6,
  }));
}

function buildWave() {
  const points = [];
  for (let x = 0; x <= 150; x += 2) {
    const envelope = Math.sin((x / 150) * Math.PI);
    const y = (Math.sin(x * 0.55) * 7 + Math.sin(x * 1.3) * 5) * envelope;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

const NETWORK = buildNetwork(607, 70, 248, 260);
const STARS = buildStars(90);
const WAVE = buildWave();

// 半透明的立體：先畫背面再畫正面，看起來才像玻璃；面朝左偏紫、朝右偏青
function GlassSolid({ shape, cx, cy, size, rotation }) {
  const points = shape.verts.map((vert) => rotate(vert, rotation));
  const faces = shape.faces
    .map((indices) => {
      const center = [0, 1, 2].map((axis) => indices.reduce((sum, i) => sum + points[i][axis], 0) / indices.length);
      return { indices, facingLeft: center[0] < 0, front: center[2] > 0 };
    })
    .sort((a, b) => Number(a.front) - Number(b.front));

  return (
    <g filter="url(#lb-soft-glow)">
      {faces.map(({ indices, facingLeft, front }) => (
        <polygon
          key={indices.join('-')}
          points={indices.map((i) => `${cx + points[i][0] * size},${cy + points[i][1] * size}`).join(' ')}
          fill={`url(#${facingLeft ? 'lb-glass-purple' : 'lb-glass-cyan'})`}
          fillOpacity={front ? 0.4 : 0.14}
          stroke={facingLeft ? '#B79CFF' : '#7DF6FF'}
          strokeOpacity={front ? 0.9 : 0.3}
          strokeWidth={front ? 1.4 : 0.8}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

function Bubble({ cx, cy, r, tint }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${tint})`} stroke="#CFE9FF" strokeOpacity="0.5" strokeWidth="0.8" />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.26} ry={r * 0.14} fill="#fff" fillOpacity="0.75" transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.4})`} />
    </g>
  );
}

function Orbit() {
  const cx = 610;
  const cy = 165;
  const front = `M${cx - 450} ${cy} A450 118 0 0 0 ${cx + 450} ${cy}`;
  const back = `M${cx - 450} ${cy} A450 118 0 0 1 ${cx + 450} ${cy}`;
  return (
    <g transform={`rotate(13 ${cx} ${cy})`} fill="none">
      <path d={back} stroke="#6FA8FF" strokeOpacity="0.4" strokeWidth="1" />
      <path d={front} stroke="url(#lb-orbit)" strokeWidth="12" filter="url(#lb-glow)" />
      <path d={front} stroke="url(#lb-orbit-core)" strokeWidth="3" />
    </g>
  );
}

function Hud() {
  return (
    <g className="landing-hud">
      {HUD_INFO.map((line, index) => <text key={line} x="34" y={136 + index * 17}>{line}</text>)}

      <path d="M38 306 H218 M38 476 H218 M38 306 V316 M218 466 V476" />
      <text x="62" y="328">GENERATIVE OUTPUT</text>
      <polyline points={WAVE} transform="translate(62 362)" />
      {HUD_OUTPUTS.map(([label, width], index) => (
        <g key={label}>
          <text x="62" y={398 + index * 17}>{label}</text>
          <rect x="142" y={393 + index * 17} width={width} height="3" rx="1.5" />
        </g>
      ))}

      <path d="M1062 110 V290 H1192 M1192 280 V290" />
      <text x="1086" y="162">NEURAL NETWORK</text>
      <text x="1086" y="178">v7.3.1</text>
      {HUD_LAYERS.map(([label, value], index) => (
        <g key={label}>
          <text x="1086" y={200 + index * 17}>{label}</text>
          <text x="1160" y={200 + index * 17}>{value}</text>
        </g>
      ))}

      {HUD_MOTTO.map(([word, y]) => <text key={word} x="1090" y={y} className="landing-hud-wide">{word}</text>)}
      <path d="M1090 406 H1102 M1090 446 H1102" />
    </g>
  );
}

export default function HeroBackground() {
  return (
    <svg className="landing-hero-art" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="lb-sky" cx="50%" cy="20%" r="85%">
          <stop offset="0%" stopColor="#141A3A" />
          <stop offset="55%" stopColor="#090B18" />
          <stop offset="100%" stopColor="#04050B" />
        </radialGradient>
        <radialGradient id="lb-sphere" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#7A3CFF" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#2450D8" stopOpacity="0.42" />
          <stop offset="92%" stopColor="#3E7BFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#D5EEFF" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="lb-bubble-blue" cx="45%" cy="40%" r="55%">
          <stop offset="55%" stopColor="#0B1030" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7DD3FF" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id="lb-bubble-purple" cx="45%" cy="40%" r="55%">
          <stop offset="40%" stopColor="#3A1C8C" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#C58BFF" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="lb-text-shade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#04050B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#04050B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lb-glass-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8FF4FF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#123A7A" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="lb-glass-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B28BFF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2A1470" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="lb-orbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5B7CFF" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#35E0FF" />
          <stop offset="100%" stopColor="#9A4DFF" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="lb-orbit-core" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#CFE0FF" />
          <stop offset="55%" stopColor="#fff" />
          <stop offset="100%" stopColor="#E3CCFF" />
        </linearGradient>
        <linearGradient id="lb-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04050B" stopOpacity="0" />
          <stop offset="100%" stopColor="#1A2348" stopOpacity="0.75" />
        </linearGradient>
        <filter id="lb-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="lb-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#lb-sky)" />
      {STARS.map((star) => <circle key={`${star.x}-${star.y}`} cx={star.x} cy={star.y} r={star.r} fill="#BFD4FF" fillOpacity={star.opacity} />)}

      <circle cx="607" cy="70" r="248" fill="url(#lb-sphere)" stroke="#BFE6FF" strokeOpacity="0.45" />
      <g fill="none" stroke="#7FA8FF" strokeOpacity="0.16">
        {[0.3, 0.62, 0.88].map((scale) => <ellipse key={scale} cx="607" cy="70" rx={248 * scale} ry="248" />)}
        {[0.3, 0.62, 0.88].map((scale) => <ellipse key={scale} cx="607" cy="70" rx="248" ry={248 * scale} />)}
      </g>
      <g stroke="#9C8CFF" strokeWidth="0.8">
        {NETWORK.links.map(([from, to]) => (
          <line key={`${from.x}-${from.y}-${to.x}-${to.y}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeOpacity={0.3 + Math.max(from.z, 0) * 0.6} />
        ))}
      </g>
      <g filter="url(#lb-soft-glow)">
        {NETWORK.nodes.map((node) => (
          <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={1 + Math.max(node.z, 0) * 1.6} fill={node.z > 0.45 ? '#E8F4FF' : '#7FD6FF'} />
        ))}
      </g>

      <rect y="500" width={WIDTH} height="116" fill="url(#lb-floor)" />
      <g fill="none">
        <path d="M210 610 Q430 560 760 612" stroke="#49C8FF" strokeWidth="2" filter="url(#lb-soft-glow)" />
        <path d="M470 560 Q640 572 760 606" stroke="#8F6BFF" strokeWidth="1.6" filter="url(#lb-soft-glow)" />
        <path d="M0 540 Q110 530 240 560" stroke="#8091C8" strokeOpacity="0.4" strokeWidth="6" filter="url(#lb-glow)" />
        <path d="M900 600 Q1060 556 1214 548" stroke="#3E7BFF" strokeOpacity="0.7" strokeWidth="1.4" />
      </g>

      <Bubble cx={975} cy={90} r={36} tint="lb-bubble-blue" />
      <Bubble cx={988} cy={296} r={36} tint="lb-bubble-purple" />
      <Bubble cx={402} cy={380} r={19} tint="lb-bubble-blue" />
      <Bubble cx={528} cy={392} r={14} tint="lb-bubble-blue" />

      <GlassSolid shape={CUBE} cx={284} cy={276} size={32} rotation={[0.62, 0.72, 0.1]} />
      <GlassSolid shape={GEM} cx={388} cy={468} size={58} rotation={[0.25, 0.6, 0.35]} />
      <GlassSolid shape={CUBE} cx={846} cy={482} size={70} rotation={[0.6, -0.68, -0.14]} />
      <GlassSolid shape={CUBE} cx={1170} cy={612} size={52} rotation={[0.55, 0.7, 0.05]} />

      <ellipse cx="607" cy="300" rx="470" ry="130" fill="url(#lb-text-shade)" />
      <Orbit />
      <Hud />
    </svg>
  );
}
