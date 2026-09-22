import StudentHome from './pages/student/StudentHome.jsx'

/*
  這裡先直接掛載「學生端首頁」元件作為第一個轉換範例。
  之後接上 react-router-dom 後，這裡會換成 <Routes>/<Route>，
  不同網址對應 src/pages/student、src/pages/teacher 底下的各個畫面元件。
  目前尚未轉換的畫面仍可參考 src/prototypes 裡的兩份原型 HTML。
*/
export default function App() {
  function handleGoArena() {
    alert('（demo）之後這裡會導向商業兩難競技場的加入流程')
  }

  return (
    <main style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
      <StudentHome onGoArena={handleGoArena} />
    </main>
  )
}
