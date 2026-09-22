import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到 GitHub Pages 子路径时资源必须带前缀，否则页面白屏。
// 部署在域名根目录时用 VITE_BASE_URL=/ 覆盖。
const base = process.env.VITE_BASE_URL || '/azur-lane-data-site/'

export default defineConfig({
  base,
  plugins: [react()],
})
