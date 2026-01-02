import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This proxies websocket and API calls to our Node server
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
