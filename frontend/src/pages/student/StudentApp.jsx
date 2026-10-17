import { useRef, useState } from 'react';
import './student.css';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Home from './screens/Home.jsx';
import Dojo from './screens/Dojo.jsx';
import Placeholder from './screens/Placeholder.jsx';
import { seedDemoProgress, allProblemIdsInOrder, isProblemClickable, freshPracticeState } from './data.js';

const MY_NAME = '劉亭慧';

const TITLES = {
  home: ['練習題', '選一題開始練習，跟 AI 多輪對話完成任務'],
  dojo: ['作答中', '跟 AI 多輪對話，完成這一題'],
  courses: ['我的課程', '選一門課程，查看目前正在進行的競賽'],
  history: ['競賽紀錄', '你參加過的商業兩難競技場，點開查看當時的完整回饋'],
  profile: ['個人資料', '基本資料與 4D 能力報表'],
  settings: ['設定', '帳號、通知與隱私設定'],
};

const PLACEHOLDER_TITLES = { courses: '我的課程', history: '競賽紀錄', profile: '個人資料', settings: '設定' };

export default function StudentApp() {
  const [screen, setScreen] = useState('home');
  const [practiceState, setPracticeState] = useState(() => seedDemoProgress());
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [toast, setToast] = useState(null);
  const demoFailureShownRef = useRef(false);
  const toastTimerRef = useRef(null);

  function goto(id) {
    setScreen(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  }

  function updateProblemState(id, updater) {
    setPracticeState((prev) => {
      const current = prev[id] || freshPracticeState();
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [id]: next };
    });
  }

  function handleSelectProblem(id) {
    setCurrentProblemId(id);
    goto('dojo');
  }

  function handleGoToNextProblem() {
    const ids = allProblemIdsInOrder();
    const nextId = ids[ids.indexOf(currentProblemId) + 1];
    if (nextId && isProblemClickable(practiceState, nextId)) {
      handleSelectProblem(nextId);
    } else {
      goto('home');
    }
  }

  const [title, subtitle] = TITLES[screen] || ['', ''];

  return (
    <div className="stu-root">
      <Sidebar screen={screen === 'dojo' ? null : screen} onGoto={goto} name={MY_NAME} />
      <div className="stu-main-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          name={MY_NAME}
          onGotoProfile={() => goto('profile')}
          onGotoSettings={() => goto('settings')}
        />
        <main className="stu-main">
          {screen === 'home' && (
            <Home practiceState={practiceState} currentProblemId={currentProblemId} onSelectProblem={handleSelectProblem} />
          )}
          {screen === 'dojo' && currentProblemId && (
            <Dojo
              key={currentProblemId}
              problemId={currentProblemId}
              state={practiceState[currentProblemId] || freshPracticeState()}
              onUpdate={(updater) => updateProblemState(currentProblemId, updater)}
              onBack={() => goto('home')}
              onGoToNextProblem={handleGoToNextProblem}
              demoFailureShownRef={demoFailureShownRef}
              showToast={showToast}
            />
          )}
          {PLACEHOLDER_TITLES[screen] && (
            <Placeholder title={PLACEHOLDER_TITLES[screen]} onBack={() => goto('home')} />
          )}
        </main>
      </div>
      <div className={`stu-toast${toast ? ' stu-toast-show' : ''}`}>
        <div className="stu-toast-body">{toast || '—'}</div>
      </div>
    </div>
  );
}
