import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash at build time
const gitHash = execSync('git rev-parse --short HEAD').toString().trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/act-values/',
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  build: {
    // Generate hashed filenames for cache busting
    rollupOptions: {
      output: {
        // Add timestamp to chunk names for better cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  }
})
