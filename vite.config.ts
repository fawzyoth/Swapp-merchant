import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Swapp-merchant/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
