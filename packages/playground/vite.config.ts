import type { Plugin } from 'vite';

import { cpus } from 'node:os';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';
import wasm from 'vite-plugin-wasm';

import { hmrPlugin } from './scripts/hmr-plugin';

const enableIstanbul = !!process.env.COVERAGE;

export function sourcemapExclude(): Plugin {
  return {
    name: 'sourcemap-exclude',
    transform(code: string, id: string) {
      if (id.includes('node_modules') && !id.includes('@blocksuite')) {
        return {
          code,
          // https://github.com/rollup/rollup/blob/master/docs/plugin-development/index.md#source-code-transformations
          map: { mappings: '' },
        };
      }
    },
  };
}

const clearSiteDataPlugin = () =>
  ({
    name: 'clear-site-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/Clear-Site-Data') {
          res.statusCode = 200;
          res.setHeader('Clear-Site-Data', '"*"');
        }
        next();
      });
    },
  }) as Plugin;

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, __dirname, '') };

  return defineConfig({
    envDir: __dirname,
    define: {
      'import.meta.env.PLAYGROUND_SERVER': JSON.stringify(
        process.env.PLAYGROUND_SERVER ?? 'http://localhost:8787'
      ),
      'import.meta.env.PLAYGROUND_WS': JSON.stringify(
        process.env.PLAYGROUND_WS ?? 'ws://localhost:8787'
      ),
    },
    plugins: [
      hmrPlugin,
      sourcemapExclude(),
      enableIstanbul &&
        istanbul({
          cwd: fileURLToPath(new URL('../..', import.meta.url)),
          include: ['packages/**/src/*'],
          exclude: [
            'node_modules',
            'tests',
            fileURLToPath(new URL('.', import.meta.url)),
          ],
          forceBuildInstrument: true,
        }),
      wasm(),
      clearSiteDataPlugin(),
    ],
    esbuild: {
      target: 'es2018',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      dedupe: [
        'yjs',
        '@preact/signals-core',
        'lit',
        'zod',
        'minimatch',
        'nanoid',
      ],
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        cache: false,
        maxParallelFileOps: Math.max(1, cpus().length - 1),
        onwarn(warning, defaultHandler) {
          if (['EVAL', 'SOURCEMAP_ERROR'].includes(warning.code)) {
            return;
          }

          defaultHandler(warning);
        },
        input: {
          main: resolve(__dirname, 'index.html'),
          'starter/': resolve(__dirname, 'starter/index.html'),
          'examples/basic/page': resolve(
            __dirname,
            'examples/basic/page/index.html'
          ),
          'examples/basic/edgeless': resolve(
            __dirname,
            'examples/basic/edgeless/index.html'
          ),
          'examples/multiple-editors/page-page': resolve(
            __dirname,
            'examples/multiple-editors/page-page/index.html'
          ),
          'examples/multiple-editors/page-edgeless': resolve(
            __dirname,
            'examples/multiple-editors/page-edgeless/index.html'
          ),
          'examples/multiple-editors/edgeless-edgeless': resolve(
            __dirname,
            'examples/multiple-editors/edgeless-edgeless/index.html'
          ),
          'examples/inline': resolve(__dirname, 'examples/inline/index.html'),
        },
        treeshake: true,
        output: {
          sourcemapIgnoreList: relativeSourcePath => {
            const normalizedPath = path.normalize(relativeSourcePath);
            return normalizedPath.includes('node_modules');
          },
        },
      },
    },
  });
};
