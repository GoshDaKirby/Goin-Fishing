
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: change this to match your GitHub repo name, e.g. '/fish-game/'
  // Leave it as '/' only if this repo is your root goshdakirby.github.io site.
  base: '/Goin-Fishing/',
  resolve: {
    alias: {
      // The Base44 dev plugin used to resolve "@/..." imports automatically.
      // Since it's removed for this static build, this replaces that behavior.
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    // Note: the original Base44-injected dev plugin (HMR/analytics/visual-edit-agent
    // hooks that talk to the hosted Base44 backend) was removed here since it isn't
    // needed for a static GitHub Pages build and its import was missing from this
    // export, which would have broken the build.
  ]
});
