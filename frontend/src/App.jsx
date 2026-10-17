import { useState } from 'react'
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
*/
export default function App() {
  const [view, setView] = useState('teacher')

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0', background: '#F6F5F1' }}>
        <button onClick={() => setView('student')} disabled={view === 'student'}>學生端 demo</button>
        <button onClick={() => setView('teacher')} disabled={view === 'teacher'}>教師端 demo</button>
      </div>
      {view === 'student' ? <StudentApp /> : <TeacherApp />}
    </>
  )
}
