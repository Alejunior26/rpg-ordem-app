import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  return {
    plugins: [react()],
    define: Object.fromEntries([
      'REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY',
      'REACT_APP_AUTH_REDIRECT_URL', 'REACT_APP_BYPASS_AUTH',
    ].map((key) => [`process.env.${key}`, JSON.stringify(env[key] || '')])),
    test: { maxWorkers: 3, hookTimeout: 30000, environment: 'jsdom', globals: false, testTimeout: 30000 },
    build: { chunkSizeWarningLimit: 700 },
  };
});
