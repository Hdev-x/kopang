import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // MSW 핸들러에 없는 /api 요청만 백엔드(8080)로 전달됨
      "/api": "http://localhost:8080",
      "/oauth2/authorization": "http://localhost:8080",
    },
  },
})
