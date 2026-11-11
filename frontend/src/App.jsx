import { useState } from 'react'
import Landing from './pages/landing/Landing.jsx'
import StudentApp from './pages/student/StudentApp.jsx'
import TeacherApp from './pages/teacher/TeacherApp.jsx'

/*
  這裡先用一個簡單的按鈕在「學生端」與「教師端」之間切換，
  純粹是方便本機開發時兩邊都能看/測試。
  之後接上 react-router-dom 後，這裡會換成 <Routes>/<Route>，
  不同網址對應 src/pages/student、src/pages/teacher 底下的各個畫面元件，
  屆時這個切換按鈕就可以拿掉。
  學生端目前只有首頁＋練習作答頁轉成 React（分階段轉換中），其餘畫面
  （我的課程／競賽紀錄／個人資料／設定／賽場等）仍可參考
  src/prototypes/學生端 這份原型 HTML，之後會陸續轉換。
  打開網站先看到入口首頁（Landing），按 Student／Teacher 進對應的 demo。
  學生端（競賽畫面）不顯示切換按鈕，左上角 logo 就能回首頁；教師端還沒有 logo，
  所以先保留上方切換列回首頁。
*/
export default function App() {
  const [view, setView] = useState('landing')

  if (view === 'landing') return <Landing onStudent={() => setView('student')} onTeacher={() => setView('teacher')} />
  if (view === 'student') return <StudentApp onBack={() => setView('landing')} />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0', background: '#F6F5F1' }}>
        <button onClick={() => setView('landing')}>首頁</button>
        <button onClick={() => setView('student')}>學生端 demo</button>
        <button disabled>教師端 demo</button>
      </div>
      <TeacherApp />
    </>
  )
}
