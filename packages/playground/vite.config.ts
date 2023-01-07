import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'url';
let DEFAULT_ROOM = '';
// Refs: https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables
if (process.env.VERCEL === '1') {
  DEFAULT_ROOM = `${process.env.VERCEL_GIT_COMMIT_REF}-${process.env.VERCEL_GIT_COMMIT_SHA}`;
} else if (!process.env.CI) {
  try {
    DEFAULT_ROOM = execSync('git rev-parse --short HEAD').toString();
  } catch (_) {
    // ignore error
  }
}

process.env.VITE_DEFAULT_ROOM = DEFAULT_ROOM;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@blocksuite/blocks': path.resolve(
        fileURLToPath(new URL('../blocks/src', import.meta.url))
      ),
      '@blocksuite/blocks/*': path.resolve(
        fileURLToPath(new URL('../blocks/src/*', import.meta.url))
      ),
    },
  },
  // enable if want debug with jwst backend
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
});
