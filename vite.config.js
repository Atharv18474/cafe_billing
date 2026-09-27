import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// VITE_BASE_PATH is injected by GitHub Actions (e.g. /cafe-pos/)
// During local `npm run dev` no base path is needed (empty string = root)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
