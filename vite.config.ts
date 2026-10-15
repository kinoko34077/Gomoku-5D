import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages hosts this app below the repository subpath; local Vite stays root.
  base: process.env.GOMOKU_PAGES_BASE === '1' ? '/Gomoku-5D/' : '/',
})
