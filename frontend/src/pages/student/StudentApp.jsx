import { useEffect, useRef, useState } from 'react';
import './student.css';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Home from './screens/Home.jsx';
import Dojo from './screens/Dojo.jsx';
import Profile from './screens/Profile.jsx';
import Settings from './screens/Settings.jsx';
import Courses from './screens/Courses.jsx';
import CourseDetail from './screens/CourseDetail.jsx';
import StudentDetail from './screens/StudentDetail.jsx';
import TeacherDetail from './screens/TeacherDetail.jsx';
import History from './screens/History.jsx';
import Arena from './screens/Arena.jsx';
import Results from './screens/Results.jsx';
import {
  seedDemoProgress, allProblemIdsInOrder, isProblemClickable, freshPracticeState,
  DEFAULT_MY_NAME, DEFAULT_MY_EMAIL, DEFAULT_VISIBILITY, freshArenaState, DEMO_HINT_TEXT,
} from './data.js';
import { applyUiScale, getUiScaleId, resetUiScale } from './uiScale.js';

/*
  背景小裝飾：做法跟教師端 TeacherApp.jsx 的 BgDecor 一樣（固定鋪在畫面後面的一層小圖示，
  純裝飾、pointer-events:none、aria-hidden），但不是直接複製教師端那組星星／閃光／愛心——
  形狀換成葉子／水滴／菱形／泡泡／三角形，顏色用學生端本來就在用的 --d1~d4 教學面色票
  （比教師端那組高飽和彩虹色更沉穩一點），動畫也換成「左右搖擺」跟「上下浮動＋呼吸縮放」
  （見 student.css 的 stuDecoDrift／stuDecoBob），同樣的手法、不同的風格。
*/
const STU_D_COLORS = ['#C1495B', '#C98A2E', '#2F8F6C', '#3B6EA5'];
const STU_BG_DECO = [
  { shape: 'drop',     x: '2%',  y: '14%', size: 26, color: STU_D_COLORS[3], delay: .3,  anim: 'bob' },
  { shape: 'leaf',     x: '4%',  y: '34%', size: 30, color: STU_D_COLORS[2], delay: 1.1, anim: 'drift' },
  { shape: 'diamond',  x: '1%',  y: '58%', size: 16, color: STU_D_COLORS[1], delay: .7,  anim: 'bob' },
  { shape: 'triangle', x: '3%',  y: '78%', size: 22, color: STU_D_COLORS[0], delay: 1.6, anim: 'drift' },
  { shape: 'bubble',   x: '92%', y: '10%', size: 28, color: STU_D_COLORS[3], delay: 0,   anim: 'bob' },
  { shape: 'drop',     x: '96%', y: '28%', size: 20, color: STU_D_COLORS[0], delay: 1.3, anim: 'drift' },
  { shape: 'diamond',  x: '93%', y: '48%', size: 18, color: STU_D_COLORS[2], delay: .5,  anim: 'bob' },
  { shape: 'leaf',     x: '97%', y: '66%', size: 26, color: STU_D_COLORS[1], delay: 2.0, anim: 'drift' },
  { shape: 'triangle', x: '91%', y: '86%', size: 24, color: STU_D_COLORS[3], delay: 1.0, anim: 'bob' },
  { shape: 'bubble',   x: '98%', y: '94%', size: 18, color: STU_D_COLORS[0], delay: 1.8, anim: 'drift' },
  { shape: 'diamond',  x: '20%', y: '96%', size: 14, color: STU_D_COLORS[2], delay: .9,  anim: 'bob' },
  { shape: 'leaf',     x: '45%', y: '97%', size: 20, color: STU_D_COLORS[3], delay: 1.5, anim: 'drift' },
];

const STU_DECO_PATHS = {
  drop: <path d="M12 2C9 7 5 11.5 5 15.5a7 7 0 0 0 14 0C19 11.5 15 7 12 2z" fill="currentColor" />,
  leaf: (
    <>
      <path d="M3 21C3 12 9 3 21 3c0 12-9 18-18 18z" fill="currentColor" opacity=".9" />
      <path d="M21 3C13 9 8 14 3 21" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".4" />
    </>
  ),
  diamond: <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" fill="currentColor" />,
  bubble: (
    <>
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".75" />
      <circle cx="9" cy="9" r="1.6" fill="currentColor" />
    </>
  ),
  triangle: <path d="M12 3l9 17H3z" fill="currentColor" strokeLinejoin="round" />,
};

function StuBgDecor() {
  return (
    <div className="stu-bg-deco" aria-hidden="true">
      {STU_BG_DECO.map((d, i) => (
        <svg
          key={i}
          className={`stu-bg-deco-item ${d.anim}`}
          viewBox="0 0 24 24"
          style={{ left: d.x, top: d.y, width: d.size, height: d.size, color: d.color, animationDelay: `${d.delay}s` }}
        >
          {STU_DECO_PATHS[d.shape]}
        </svg>
      ))}
    </div>
  );
}

const TITLES = {
  home: ['練習題', '選一題開始練習，跟 AI 多輪對話完成任務'],
  dojo: ['作答中', '跟 AI 多輪對話，完成這一題'],
  courses: ['我的課程', '選一門課程，查看目前正在進行的競賽'],
  'course-detail': ['課程詳情', '進行中的競賽與作業'],
  'student-detail': ['學生詳情', '這位同學公開的個人資料'],
  'teacher-detail': ['教師詳情', '這位教師的基本資料與開課紀錄'],
  history: ['競賽紀錄', '你參加過的商業兩難競技場，點開查看當時的完整回饋'],
  profile: ['個人資料', '基本資料與 4D 能力報表'],
  settings: ['設定', '帳號、通知與隱私設定'],
};

const COURSE_CLUSTER_SCREENS = ['courses', 'course-detail', 'student-detail', 'teacher-detail'];
const FIVE_MIN_WARNING_TEXT = '時間剩五分鐘，請盡快請 AI 彙整小組解方！';

export default function StudentApp() {
  const [screen, setScreen] = useState('home');
  const [practiceState, setPracticeState] = useState(() => seedDemoProgress());
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [toast, setToast] = useState(null);
  const [teacherHintToast, setTeacherHintToast] = useState(null);
  const [myName, setMyName] = useState(DEFAULT_MY_NAME);
  const [myEmail, setMyEmail] = useState(DEFAULT_MY_EMAIL);
  const [myBio, setMyBio] = useState('');
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY);
  const [darkMode, setDarkMode] = useState(false);
  // 一進網站先呈現收合狀態，跟教師端一致（見 TeacherApp.jsx 的 sidebarOpen 預設值）
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [inArena, setInArena] = useState(false);
  const [hasActiveMatch, setHasActiveMatch] = useState(false);
  const [arenaState, setArenaState] = useState(null);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const demoFailureShownRef = useRef(false);
  const toastTimerRef = useRef(null);
  const teacherHintTimerRef = useRef(null);
  const warnedFiveMinRef = useRef(false);
  const screenBeforeArenaRef = useRef('home');

  // 學生端整頁放大（預設「大」，畫面整體比較好讀），離開學生端時還原，不影響教師端
  useEffect(() => {
    applyUiScale(getUiScaleId());
    return () => resetUiScale();
  }, []);

  function goto(id) {
    setScreen(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  }

  // 比賽倒數：只要有進行中的比賽就持續倒數，不受畫面切換／離開賽場影響
  useEffect(() => {
    if (!hasActiveMatch) return undefined;
    const interval = setInterval(() => {
      setArenaState((prev) => {
        if (!prev || prev.isArenaPaused || prev.matchSecondsLeft <= 0) return prev;
        return { ...prev, matchSecondsLeft: prev.matchSecondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveMatch]);

  // 剩五分鐘時跳一次系統提示（只提醒一次）
  useEffect(() => {
    if (arenaState && arenaState.matchSecondsLeft === 300 && !warnedFiveMinRef.current) {
      warnedFiveMinRef.current = true;
      showToast(FIVE_MIN_WARNING_TEXT);
    }
  }, [arenaState?.matchSecondsLeft]);

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

  function handleToggleVisibility(key, value) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectCourse(id) {
    setSelectedCourseId(id);
    goto('course-detail');
  }

  function handleSelectStudent(id) {
    setSelectedStudentId(id);
    goto('student-detail');
  }

  function handleSelectTeacher(id) {
    setSelectedTeacherId(id);
    goto('teacher-detail');
  }

  function enterArena() {
    if (!inArena) {
      screenBeforeArenaRef.current = screen;
    }
    setInArena(true);
    if (!hasActiveMatch) {
      // 只有真的開始一場「新」比賽才重置——中途離開再回來要接續原本進度
      setHasActiveMatch(true);
      setArenaState(freshArenaState());
      warnedFiveMinRef.current = false;
    }
    goto('arena-student');
  }

  function exitArena() {
    // 比賽仍在後台繼續進行（倒數不停），只是先離開畫面，回來時會接續原本進度
    setInArena(false);
    goto(screenBeforeArenaRef.current || 'home');
  }

  function handleEndCompetition() {
    setHasActiveMatch(false);
    goto('results-student');
  }

  function openCodeModal() {
    setCodeInput('');
    setCodeModalOpen(true);
  }

  function handleCodeJoin() {
    if (codeInput.trim().length > 0) {
      setCodeModalOpen(false);
      enterArena();
    }
  }

  function handleMascotClick() {
    if (inArena) { exitArena(); return; }
    // 還有一場先前退出、尚未結束的競賽時，先問使用者要不要直接接續，而不是直接跳去輸入代碼
    if (hasActiveMatch) { setResumeModalOpen(true); return; }
    openCodeModal();
  }

  function handleResumeYes() {
    setResumeModalOpen(false);
    enterArena();
  }

  function handleResumeNo() {
    setResumeModalOpen(false);
    openCodeModal();
  }

  function handleReplayHint() {
    setTeacherHintToast(DEMO_HINT_TEXT);
    clearTimeout(teacherHintTimerRef.current);
    teacherHintTimerRef.current = setTimeout(() => setTeacherHintToast(null), 4200);
  }

  const [title, subtitle] = TITLES[screen] || ['', ''];
  const sidebarScreen = COURSE_CLUSTER_SCREENS.includes(screen) ? 'courses' : (screen === 'dojo' ? null : screen);

  return (
    <div className="stu-root" data-theme={darkMode ? 'dark' : 'light'}>
      <StuBgDecor />
      {!inArena && <Sidebar screen={sidebarScreen} onGoto={goto} name={myName} collapsed={!sidebarOpen} />}
      <div className={`stu-main-col${(inArena || !sidebarOpen) ? ' stu-main-col-full' : ''}`}>
        {!inArena && (
          <Topbar
            title={title}
            subtitle={subtitle}
            name={myName}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onGotoProfile={() => goto('profile')}
            onGotoSettings={() => goto('settings')}
          />
        )}
        <main className="stu-main">
          <div className="stu-screen-pop" key={screen}>
          {screen === 'home' && (
            <Home practiceState={practiceState} currentProblemId={currentProblemId} onSelectProblem={handleSelectProblem} myName={myName} />
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
          {screen === 'profile' && (
            <Profile
              myName={myName}
              myEmail={myEmail}
              myBio={myBio}
              onSaveBio={setMyBio}
              visibility={visibility}
              onToggleVisibility={handleToggleVisibility}
              practiceState={practiceState}
              showToast={showToast}
            />
          )}
          {screen === 'settings' && (
            <Settings
              myName={myName}
              myEmail={myEmail}
              onSaveName={setMyName}
              onSaveEmail={setMyEmail}
              darkMode={darkMode}
              onToggleDarkMode={setDarkMode}
              showToast={showToast}
            />
          )}
          {screen === 'courses' && (
            <Courses onSelectCourse={handleSelectCourse} />
          )}
          {screen === 'course-detail' && selectedCourseId && (
            <CourseDetail
              courseId={selectedCourseId}
              myName={myName}
              onBack={() => goto('courses')}
              onSelectStudent={handleSelectStudent}
              onSelectTeacher={handleSelectTeacher}
              onJoinArena={enterArena}
              showToast={showToast}
            />
          )}
          {screen === 'student-detail' && selectedStudentId && (
            <StudentDetail
              studentId={selectedStudentId}
              courseId={selectedCourseId}
              myName={myName}
              myEmail={myEmail}
              myBio={myBio}
              visibility={visibility}
              onBack={() => goto('course-detail')}
            />
          )}
          {screen === 'teacher-detail' && selectedTeacherId && (
            <TeacherDetail
              teacherId={selectedTeacherId}
              onBack={() => goto('course-detail')}
              onSelectCourse={handleSelectCourse}
            />
          )}
          {screen === 'history' && <History />}
          {screen === 'arena-student' && arenaState && (
            <Arena
              arenaState={arenaState}
              onUpdate={setArenaState}
              onEndCompetition={handleEndCompetition}
              onReplayHint={handleReplayHint}
              showToast={showToast}
            />
          )}
          {screen === 'results-student' && <Results showToast={showToast} />}
          </div>
        </main>
      </div>

      <div className="stu-mascot-wrap">
        <button type="button" className="stu-mascot" aria-label={inArena ? '賽場出口' : '賽場入口'} onClick={handleMascotClick} />
        <div className="stu-mascot-label">{inArena ? '賽場出口' : '賽場入口'}</div>
      </div>

      {resumeModalOpen && (
        <div className="stu-modal-veil stu-modal-veil-show">
          <div className="stu-modal-box">
            <h3>是否接續剛剛退出的競賽？</h3>
            <p>你有一場先前退出、還沒結束的競賽，可以直接回到原本的進度，或是改成輸入代碼加入別的賽場。</p>
            <div className="stu-modal-actions">
              <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={handleResumeNo}>否</button>
              <button type="button" className="stu-btn stu-btn-sm" onClick={handleResumeYes}>是</button>
            </div>
          </div>
        </div>
      )}

      {codeModalOpen && (
        <div className="stu-modal-veil stu-modal-veil-show">
          <div className="stu-modal-box">
            <h3>輸入賽場代碼</h3>
            <p>老師是本次競賽的發起人，請向老師索取 6 碼賽場代碼以加入商業兩難競技場。</p>
            <input
              className="stu-code-input"
              maxLength={6}
              placeholder="XXXXXX"
              value={codeInput}
              autoFocus
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCodeJoin(); }}
            />
            <div className="stu-modal-actions">
              <button type="button" className="stu-btn stu-btn-ghost stu-btn-sm" onClick={() => setCodeModalOpen(false)}>取消</button>
              <button type="button" className="stu-btn stu-btn-sm" onClick={handleCodeJoin}>加入賽場</button>
            </div>
          </div>
        </div>
      )}

      <div className={`stu-toast${teacherHintToast ? ' stu-toast-show' : ''}`}>
        <div className="stu-toast-who"><span className="stu-toast-badge">來自教師</span>C 隊 · 引導提示</div>
        <div className="stu-toast-body">{teacherHintToast || '—'}</div>
      </div>
      <div className={`stu-toast stu-toast-upper${toast ? ' stu-toast-show' : ''}`}>
        <div className="stu-toast-body">{toast || '—'}</div>
      </div>
    </div>
  );
}
