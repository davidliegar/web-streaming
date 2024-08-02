import { fileURLToPath, URL } from 'node:url'
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await";

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    vue(),
    vueDevTools(),
  ],
  server: {
    port: 8080
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      external: 'matrix-functions-wasm'
    }
  }
})
