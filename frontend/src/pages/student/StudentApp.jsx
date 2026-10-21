import { useRef, useState } from 'react';
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
import Placeholder from './screens/Placeholder.jsx';
import {
  seedDemoProgress, allProblemIdsInOrder, isProblemClickable, freshPracticeState,
  DEFAULT_MY_NAME, DEFAULT_MY_EMAIL, DEFAULT_VISIBILITY,
} from './data.js';

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
const PLACEHOLDER_TITLES = { history: '競賽紀錄' };

export default function StudentApp() {
  const [screen, setScreen] = useState('home');
  const [practiceState, setPracticeState] = useState(() => seedDemoProgress());
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [toast, setToast] = useState(null);
  const [myName, setMyName] = useState(DEFAULT_MY_NAME);
  const [myEmail, setMyEmail] = useState(DEFAULT_MY_EMAIL);
  const [myBio, setMyBio] = useState('');
  const [visibility, setVisibility] = useState(DEFAULT_VISIBILITY);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
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

  const [title, subtitle] = TITLES[screen] || ['', ''];
  const sidebarScreen = COURSE_CLUSTER_SCREENS.includes(screen) ? 'courses' : (screen === 'dojo' ? null : screen);

  return (
    <div className="stu-root" data-theme={darkMode ? 'dark' : 'light'}>
      <Sidebar screen={sidebarScreen} onGoto={goto} name={myName} />
      <div className="stu-main-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          name={myName}
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
