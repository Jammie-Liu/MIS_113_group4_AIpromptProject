import { useState } from 'react'
import StudentHome from './pages/student/StudentHome.jsx'
import TeacherApp from './pages/teacher/TeacherApp.jsx'

/*
  這裡先用一個簡單的按鈕在「學生端首頁」與「教師端」之間切換，
  純粹是方便本機開發時兩邊都能看/測試。
  之後接上 react-router-dom 後，這裡會換成 <Routes>/<Route>，
  不同網址對應 src/pages/student、src/pages/teacher 底下的各個畫面元件，
  屆時這個切換按鈕就可以拿掉。
  目前尚未轉換的畫面仍可參考 src/prototypes 裡的兩份原型 HTML。
*/
export default function App() {
  const [view, setView] = useState('teacher')

  function handleGoArena() {
    alert('（demo）之後這裡會導向商業兩難競技場的加入流程')
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0', background: '#F6F5F1' }}>
        <button onClick={() => setView('student')} disabled={view === 'student'}>學生端 demo</button>
        <button onClick={() => setView('teacher')} disabled={view === 'teacher'}>教師端 demo</button>
      </div>
      {view === 'student' ? (
        <main style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
          <StudentHome onGoArena={handleGoArena} />
        </main>
      ) : (
        <TeacherApp />
      )}
    </>
  )
}
