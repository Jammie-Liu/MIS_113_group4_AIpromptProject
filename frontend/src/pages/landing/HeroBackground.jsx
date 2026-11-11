import { useEffect, useRef } from 'react';

// 首頁動態背景：場景畫在 canvas 上，每一格依時間 t 重畫一次，沒有外部圖片。
// 座標以 1214×616 為準，畫的時候等比例放大到蓋滿畫面（超出的部分裁掉）。
// 兩側的儀表面板用 SVG＋CSS 動畫，另外貼齊左右兩邊，畫面比例改變時才不會被裁掉。
const WIDTH = 1214;
const HEIGHT = 616;
const SPHERE = { x: 607, y: 110, r: 248 };
const ORBIT = { x: 610, y: 205, rx: 450, ry: 118, tilt: 0.227 };

const CUBE = {
  verts: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
  faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]],
};
const GEM = {
  verts: [[0, -1.35, 0], [0, 1.35, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]],
  faces: [[0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2], [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]],
};

// spin 是每秒繞 X、Y、Z 轉幾弧度；bob 是上下漂浮的幅度
const SOLIDS = [
  { shape: CUBE, x: 284, y: 290, size: 32, rotation: [0.62, 0.72, 0.1], spin: [0.12, 0.22, 0], bob: 8 },
  { shape: GEM, x: 388, y: 478, size: 54, rotation: [0.25, 0.6, 0.35], spin: [0, 0.32, 0], bob: 10 },
  { shape: CUBE, x: 880, y: 470, size: 64, rotation: [0.6, -0.68, -0.14], spin: [0.08, -0.16, 0.04], bob: 12 },
  { shape: CUBE, x: 1170, y: 600, size: 52, rotation: [0.55, 0.7, 0.05], spin: [-0.1, 0.14, 0], bob: 6 },
];
const BUBBLES = [
  { x: 975, y: 110, r: 36, rim: '125, 211, 255', bob: 12 },
  { x: 988, y: 300, r: 36, rim: '197, 139, 255', bob: 14 },
  { x: 402, y: 390, r: 19, rim: '125, 211, 255', bob: 9 },
  { x: 528, y: 410, r: 14, rim: '125, 211, 255', bob: 7 },
];
// 底部的光線：先畫一條暗的底線，再讓亮的小段沿著線跑
const FLOOR_LINES = [
  { from: [210, 610], ctrl: [430, 560], to: [760, 612], rgb: '73, 200, 255', speed: 150 },
  { from: [470, 560], ctrl: [640, 572], to: [760, 606], rgb: '143, 107, 255', speed: 110 },
  { from: [900, 600], ctrl: [1060, 556], to: [1214, 548], rgb: '62, 123, 255', speed: 90 },
];

const HUD_INFO = ['MODEL: PROMPT-X', 'PARAMS: 1.6T', 'CONTEXT: 128K', 'STATUS: ONLINE'];
const HUD_OUTPUTS = [['TEXT', 46], ['IMAGE', 30], ['CODE', 40], ['AUDIO', 56], ['VIDEO', 34]];
const HUD_LAYERS = [['LAYER 1', 1024], ['LAYER 2', 2048], ['LAYER 3', 4096], ['LAYER 4', 2048], ['LAYER 5', 1024]];
const HUD_MOTTO = [['HUMAN', 386], ['AI', 426], ['TOGETHER', 466], ['FURTHER', 492]];

// 固定種子的亂數：每次打開頁面，星點和網路的位置都一樣
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

// 在單位球面上均勻撒點（費氏球面），再把每個點連到最近的三個點。只算一次，之後每格只旋轉
function buildNetwork(count) {
  const rand = seededRandom(7);
  const nodes = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - ((i + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = i * 2.39996 + rand() * 0.4;
    nodes.push([Math.cos(theta) * ring, y, Math.sin(theta) * ring]);
  }
  const links = [];
  nodes.forEach((node, index) => {
    nodes
      .map((other, otherIndex) => ({ otherIndex, dist: Math.hypot(other[0] - node[0], other[1] - node[1], other[2] - node[2]) }))
      .filter((item) => item.otherIndex !== index)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .forEach((item) => links.push([index, item.otherIndex]));
  });
  return { nodes, links };
}

function buildStars(count) {
  const rand = seededRandom(23);
  return Array.from({ length: count }, () => ({
    x: rand() * WIDTH,
    y: rand() * HEIGHT,
    r: 0.4 + rand() * 1.1,
    speed: 0.4 + rand() * 1.4,
    phase: rand() * Math.PI * 2,
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

const NETWORK = buildNetwork(190);
const STARS = buildStars(90);
const WAVE = buildWave();

function drawSky(ctx, t) {
  const sky = ctx.createRadialGradient(607, 120, 0, 607, 120, 900);
  sky.addColorStop(0, '#141A3A');
  sky.addColorStop(0.55, '#090B18');
  sky.addColorStop(1, '#04050B');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#BFD4FF';
  STARS.forEach((star) => {
    ctx.globalAlpha = 0.45 + Math.sin(t * star.speed + star.phase) * 0.35;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawSphere(ctx, t) {
  const { x, y, r } = SPHERE;
  const spin = t * 0.12;
  const glass = ctx.createRadialGradient(x, y + 25, 0, x, y, r);
  glass.addColorStop(0, 'rgba(122, 60, 255, 0.75)');
  glass.addColorStop(0.65, 'rgba(36, 80, 216, 0.42)');
  glass.addColorStop(0.92, 'rgba(62, 123, 255, 0.22)');
  glass.addColorStop(1, 'rgba(213, 238, 255, 0.8)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // 經線：寬度跟著旋轉角度變，看起來就像球在轉
  ctx.strokeStyle = 'rgba(127, 168, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(Math.cos(spin + (i * Math.PI) / 6)) * r, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const points = NETWORK.nodes.map((node) => {
    const [px, py, pz] = rotate(rotate(node, [0, spin, 0]), [0.3, 0, 0]);
    return { x: x + px * r, y: y + py * r, z: pz };
  });

  ctx.strokeStyle = '#9C8CFF';
  ctx.lineWidth = 0.8;
  NETWORK.links.forEach(([from, to]) => {
    const a = points[from];
    const b = points[to];
    ctx.globalAlpha = 0.1 + Math.max((a.z + b.z) / 2, 0) * 0.7;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  points.forEach((point) => {
    const front = Math.max(point.z, 0);
    ctx.globalAlpha = 0.25 + front * 0.75;
    ctx.fillStyle = point.z > 0.45 ? '#E8F4FF' : '#7FD6FF';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1 + front * 1.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // 訊號：幾個亮點沿著連線跑，跑完一條換下一條
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#7FD6FF';
  ctx.shadowBlur = 8;
  for (let i = 0; i < 14; i += 1) {
    const progress = t * 0.6 + i / 14;
    const [from, to] = NETWORK.links[(i * 37 + Math.floor(progress) * 11) % NETWORK.links.length];
    const a = points[from];
    const b = points[to];
    if (a.z > 0 && b.z > 0) {
      const along = progress % 1;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * along, a.y + (b.y - a.y) * along, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// half 是 'back' 或 'front'：光環的後半圈畫在球體後面，前半圈畫在最上層
function drawOrbit(ctx, t, half) {
  const { x, y, rx, ry } = ORBIT;
  const tilt = ORBIT.tilt + Math.sin(t * 0.25) * 0.02;
  const head = (t * 0.7) % (Math.PI * 2);
  const headInFront = head < Math.PI;

  if (half === 'back') {
    ctx.strokeStyle = 'rgba(111, 168, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, tilt, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    const glow = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
    glow.addColorStop(0, '#5B7CFF');
    glow.addColorStop(0.55, '#35E0FF');
    glow.addColorStop(1, '#9A4DFF');
    ctx.strokeStyle = glow;
    ctx.shadowColor = '#35E0FF';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 繞著光環跑的亮點，只在它目前所在的那半圈畫
  if (headInFront === (half === 'front')) {
    ctx.strokeStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, tilt, head - 0.28, head);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
  }
}

function drawFloor(ctx, t) {
  const floor = ctx.createLinearGradient(0, 500, 0, HEIGHT);
  floor.addColorStop(0, 'rgba(4, 5, 11, 0)');
  floor.addColorStop(1, 'rgba(26, 35, 72, 0.75)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 500, WIDTH, HEIGHT - 500);

  FLOOR_LINES.forEach(({ from, ctrl, to, rgb, speed }) => {
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(...from);
      ctx.quadraticCurveTo(...ctrl, ...to);
      ctx.stroke();
    };
    ctx.strokeStyle = `rgba(${rgb}, 0.45)`;
    ctx.lineWidth = 1.4;
    trace();
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.shadowColor = `rgb(${rgb})`;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.4;
    ctx.setLineDash([90, 420]);
    ctx.lineDashOffset = -t * speed;
    trace();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  });
}

function drawBubble(ctx, t, bubble, index) {
  const { x, r, rim } = bubble;
  const y = bubble.y + Math.sin(t * 0.7 + index * 1.7) * bubble.bob;
  const fill = ctx.createRadialGradient(x - r * 0.1, y - r * 0.2, r * 0.3, x, y, r);
  fill.addColorStop(0, 'rgba(11, 16, 48, 0.35)');
  fill.addColorStop(1, `rgba(${rim}, 0.8)`);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.26, r * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

// 半透明的立體：先畫背面再畫正面，看起來才像玻璃；面朝左偏紫、朝右偏青
function drawSolid(ctx, t, solid, index) {
  const { shape, size, rotation, spin } = solid;
  const angle = rotation.map((value, axis) => value + spin[axis] * t);
  const points = shape.verts.map((vert) => rotate(vert, angle));
  const cy = solid.y + Math.sin(t * 0.6 + index * 1.3) * solid.bob;

  shape.faces
    .map((indices) => {
      const center = [0, 1, 2].map((axis) => indices.reduce((sum, i) => sum + points[i][axis], 0) / indices.length);
      return { indices, facingLeft: center[0] < 0, front: center[2] > 0 };
    })
    .sort((a, b) => Number(a.front) - Number(b.front))
    .forEach(({ indices, facingLeft, front }) => {
      const corners = indices.map((i) => [solid.x + points[i][0] * size, cy + points[i][1] * size]);
      const shine = ctx.createLinearGradient(corners[0][0], corners[0][1], corners[2][0], corners[2][1]);
      shine.addColorStop(0, facingLeft ? 'rgba(178, 139, 255, 0.6)' : 'rgba(143, 244, 255, 0.55)');
      shine.addColorStop(1, facingLeft ? 'rgba(42, 20, 112, 0.3)' : 'rgba(18, 58, 122, 0.25)');

      ctx.beginPath();
      corners.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.closePath();
      ctx.globalAlpha = front ? 0.5 : 0.18;
      ctx.fillStyle = shine;
      ctx.fill();
      ctx.globalAlpha = front ? 0.9 : 0.3;
      ctx.strokeStyle = facingLeft ? '#B79CFF' : '#7DF6FF';
      ctx.lineWidth = front ? 1.4 : 0.8;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = front ? 8 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  ctx.globalAlpha = 1;
}

// 文字後面墊一層暗色，物件飄過去時字還是看得清楚
function drawTextShade(ctx) {
  ctx.save();
  ctx.translate(607, 310);
  ctx.scale(1, 0.3);
  const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, 470);
  shade.addColorStop(0, 'rgba(4, 5, 11, 0.5)');
  shade.addColorStop(1, 'rgba(4, 5, 11, 0)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, 470, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScene(ctx, t) {
  drawSky(ctx, t);
  drawOrbit(ctx, t, 'back');
  drawSphere(ctx, t);
  drawFloor(ctx, t);
  BUBBLES.forEach((bubble, index) => drawBubble(ctx, t, bubble, index));
  SOLIDS.forEach((solid, index) => drawSolid(ctx, t, solid, index));
  drawTextShade(ctx);
  drawOrbit(ctx, t, 'front');
}

function HudLeft() {
  return (
    <svg className="landing-hud landing-hud-left" viewBox="20 120 210 370" aria-hidden="true">
      {HUD_INFO.map((line, index) => <text key={line} x="34" y={136 + index * 17}>{line}</text>)}
      <circle className="landing-hud-blink" cx="128" cy="184" r="2.5" />

      <path d="M38 306 H218 M38 476 H218 M38 306 V316 M218 466 V476" />
      <text x="62" y="328">GENERATIVE OUTPUT</text>
      <polyline className="landing-hud-wave" points={WAVE} transform="translate(62 362)" />
      {HUD_OUTPUTS.map(([label, width], index) => (
        <g key={label}>
          <text x="62" y={398 + index * 17}>{label}</text>
          <rect x="142" y={393 + index * 17} width={width} height="3" rx="1.5" style={{ animationDelay: `${index * -0.6}s` }} />
        </g>
      ))}
    </svg>
  );
}

function HudRight() {
  return (
    <svg className="landing-hud landing-hud-right" viewBox="1050 100 150 410" aria-hidden="true">
      <path d="M1062 110 V290 H1192 M1192 280 V290" />
      <text x="1086" y="162">NEURAL NETWORK</text>
      <text x="1086" y="178">v7.3.1</text>
      {HUD_LAYERS.map(([label, value], index) => (
        <g key={label} className="landing-hud-pulse" style={{ animationDelay: `${index * 0.4}s` }}>
          <text x="1086" y={200 + index * 17}>{label}</text>
          <text x="1160" y={200 + index * 17}>{value}</text>
        </g>
      ))}

      {HUD_MOTTO.map(([word, y], index) => (
        <text key={word} x="1090" y={y} className="landing-hud-wide landing-hud-pulse" style={{ animationDelay: `${index * 0.5}s` }}>{word}</text>
      ))}
      <path d="M1090 406 H1102 M1090 446 H1102" />
    </svg>
  );
}

export default function HeroBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // 系統設定「減少動態效果」的人只畫一張靜態畫面
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      // 解析度最多 1.5 倍：背景不用太銳利，像素少一半，一般筆電才跑得順
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      // 取比較大的縮放比才能蓋滿畫面，再置中，多的部分裁掉（跟 CSS 的 cover 一樣）
      const scale = Math.max(canvas.width / WIDTH, canvas.height / HEIGHT);
      ctx.setTransform(scale, 0, 0, scale, (canvas.width - WIDTH * scale) / 2, (canvas.height - HEIGHT * scale) / 2);
      if (reduceMotion) drawScene(ctx, 0);
    }

    function tick(now) {
      drawScene(ctx, now / 1000);
      frame = requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (!reduceMotion) frame = requestAnimationFrame(tick);

    // 離開首頁時要停掉動畫，不然畫面不見了還會一直在背景跑
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="landing-hero-art" aria-hidden="true" />
      <HudLeft />
      <HudRight />
    </>
  );
}
