import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),svelte(),],
  optimizeDeps: {
        // This is the magic line
        exclude: ['@event-calendar/core']
    },
    proxy: {
      // All requests starting with /api will be sent to port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  });
