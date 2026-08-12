import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Project page (https://simopal6.github.io/guitar-exercises/) needs a
  // non-root base for production asset URLs; keep it "/" for the dev server.
  base: command === 'build' ? '/guitar-exercises/' : '/',
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
}))
