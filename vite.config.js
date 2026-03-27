import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // <- Esto hace que todos los paths en index.html sean relativos
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})