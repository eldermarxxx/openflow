import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { openflowRunner } from './runner/plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), openflowRunner()],
})
