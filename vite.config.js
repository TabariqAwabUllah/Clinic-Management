import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // This is crucial for Electron to find files
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true
  }
})