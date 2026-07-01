import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Cloudflare Pages serves this project from the domain root, while the
  // local/GitHub Pages preview keeps the repository subpath.
  base: process.env.CF_PAGES ? '/' : '/-2-LRL-/',
  plugins: [react()],
})
