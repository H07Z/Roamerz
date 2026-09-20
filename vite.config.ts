import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL'
    },
    hmr: {
      clientPort: 443
    },
    // Allow Arena preview hosts
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  }
});
