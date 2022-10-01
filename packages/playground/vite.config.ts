import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // resolve: {
  //   alias: {
  //     'quill-themes-snow': 'quill/themes/snow.js',
  //     'quill-toolbar': 'quill/modules/toolbar.js',
  //     'quill.snow.css': 'quill/dist/quill.snow.css',
  //     quill: 'quill/dist/quill.core.js',
  //   },
  // },
  build: {
    minify: 'terser',
  },
  plugins: [react()],
});
