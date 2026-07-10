import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/mapbox-gl')) return 'mapbox-gl';
          if (id.includes('node_modules/pdf-lib') || id.includes('node_modules/@pdf-lib')) return 'pdf-lib';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
        },
      },
    },
  },
})
