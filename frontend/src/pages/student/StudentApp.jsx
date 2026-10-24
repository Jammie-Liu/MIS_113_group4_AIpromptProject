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
  DEFAULT_MY_NAME, DEFAULT_MY_EMAIL, DEFAULT_VISIBILITY, freshArenaState,
} from './data.js';
import { applyUiScale, getUiScaleId, resetUiScale } from './uiScale.js';

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
const TEACHER_HINT_TEXT = '試試看，如果你是最反對這個方案的供應商窗口，你會怎麼問 AI？';
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
    if (inArena) exitArena(); else openCodeModal();
  }

  function handleReplayHint() {
    setTeacherHintToast(TEACHER_HINT_TEXT);
    clearTimeout(teacherHintTimerRef.current);
    teacherHintTimerRef.current = setTimeout(() => setTeacherHintToast(null), 4200);
  }

  const [title, subtitle] = TITLES[screen] || ['', ''];
  const sidebarScreen = COURSE_CLUSTER_SCREENS.includes(screen) ? 'courses' : (screen === 'dojo' ? null : screen);

  return (
    <div className="stu-root" data-theme={darkMode ? 'dark' : 'light'}>
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
        </main>
      </div>

      <div className="stu-mascot-wrap">
        <button type="button" className="stu-mascot" aria-label={inArena ? '賽場出口' : '賽場入口'} onClick={handleMascotClick} />
        <div className="stu-mascot-label">{inArena ? '賽場出口' : '賽場入口'}</div>
      </div>

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
