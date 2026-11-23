import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 開發時前端呼叫 /api/...，Vite 會轉給本機的後端（backend，預設 port 3000）。
    // 這樣前端程式只要寫 fetch('/api/v1/student/me')，不用寫死後端網址，也不會被瀏覽器擋（CORS）。
    // 要先在另一個終端機啟動後端：cd backend && npm run dev
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
