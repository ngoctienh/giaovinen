import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        sourcemap: false // Tắt source map để ẩn cấu trúc code gốc trên production
    }
})