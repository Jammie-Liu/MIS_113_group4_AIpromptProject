import { useState } from 'react';
import './landing.css';
import HeroBackground from './HeroBackground.jsx';

function LogoMark() {
  return (
    <svg className="landing-logo-mark" viewBox="75 240 252 220" aria-hidden="true">
      <path
        fill="#00f5fe"
        fillRule="evenodd"
        d="M87.15 285.08c6.94-6.03 7.05-6.08 13.17-6.08h6.17l42.48 40.42 42.48 40.42.36 7.34c.32 6.44.07 7.72-1.98 10.51-1.28 1.74-20.48 20.19-42.65 41-23.71 22.25-41.49 38.19-43.18 38.7-1.58.48-4.57.56-6.64.17-2.87-.54-5.64-2.53-11.57-8.3-7.59-7.38-7.8-7.72-7.8-12.37 0-2.63.48-5.84 1.07-7.14s15.1-15.71 32.25-32.02l31.18-29.67-31.2-29.66c-17.2-16.35-31.9-31.12-32.75-32.92s-1.55-4.26-1.55-5.47.71-3.69 1.58-5.52 4.72-6.06 8.57-9.4zM179 427.45c1.99-1.09 10.5-1.37 41.62-1.41 38.66-.04 39.15-.02 41.88 2.13 1.52 1.2 3.59 4.01 4.61 6.25s1.86 5.56 1.87 7.36c.01 1.81-.6 4.73-1.36 6.5s-2.81 4.57-4.57 6.22l-3.19 3H180.1l-3.54-3.43c-1.95-1.89-4.05-4.98-4.67-6.87s-.92-5.35-.66-7.67c.26-2.33 1.55-5.69 2.87-7.48 1.32-1.78 3.52-3.86 4.89-4.61z"
      />
      <path
        fill="#6702fd"
        fillRule="evenodd"
        d="M244.6 253.21c.98-6.17 2.04-11.2 2.34-11.19.31.01 1.55 5.52 2.76 12.25s3.62 16.73 5.36 22.23c1.73 5.5 4.76 12.93 6.72 16.5 1.96 3.58 6.53 9.44 10.15 13.04 4.06 4.04 9.25 7.91 13.58 10.14 3.85 1.98 11.05 4.74 16 6.15 4.95 1.4 12.38 3.09 16.5 3.76 5.44.88 6.95 1.42 5.5 1.98l-14.73 3.77c-8.14 1.92-15.86 4.51-21.4 7.19-6.67 3.23-10.33 5.86-15.88 11.4-5.44 5.44-8.22 9.27-11.33 15.65-2.27 4.64-5.26 12.42-6.64 17.29s-3.43 13.87-4.55 20l-2.04 11.16-2.52-14c-1.39-7.7-3.88-18.05-5.53-23s-4.52-11.71-6.37-15.02-6.33-8.94-9.95-12.5c-3.62-3.57-8.72-7.76-11.33-9.33-2.67-1.61-11.94-4.88-21.24-7.5L172.27 328c-.68-.29 4.27-1.81 11-3.37s14.48-3.72 17.23-4.79c2.75-1.08 8.25-3.97 12.21-6.43 3.97-2.46 9.51-7.04 12.31-10.18 2.81-3.14 6.86-9.3 9.02-13.7 2.15-4.4 5.01-11.84 6.34-16.54s3.23-13.58 4.21-19.75z"
      />
    </svg>
  );
}

// 按住時往下陷是 CSS 的 :active；放開後播回彈動畫，播完（animationend）才執行 onDone，
// 不然畫面馬上換掉就看不到回彈
function PressButton({ children, onDone }) {
  const [bouncing, setBouncing] = useState(false);

  return (
    <button
      type="button"
      className={`landing-btn${bouncing ? ' landing-btn-bounce' : ''}`}
      onClick={() => setBouncing(true)}
      onAnimationEnd={() => {
        setBouncing(false);
        onDone?.();
      }}
    >
      {children}
    </button>
  );
}

// 目前只有 Student 有事件，其他按鈕先只有外觀
export default function Landing({ onStudent }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-logo">
          <LogoMark />
          <span>Prompt Master</span>
        </div>
        <nav className="landing-links">
          <button type="button" className="landing-link landing-link-current">首頁</button>
          <button type="button" className="landing-link">學習指南</button>
        </nav>
      </header>

      <main className="landing-hero">
        <HeroBackground />
        <h1>MASTER THE PROMPT</h1>
        <p>Unlock the secrets of AI mastery through precision-based technical challenges. A high-tech game designed to transform your prompt engineering skills into clinical expertise.</p>
        <div className="landing-actions">
          <PressButton>Teacher</PressButton>
          <PressButton onDone={onStudent}>Student</PressButton>
        </div>
      </main>
    </div>
  );
}
