import fs from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GetManualChunk } from 'rollup';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import istanbul from 'vite-plugin-istanbul';
import wasm from 'vite-plugin-wasm';

import { hmrPlugin } from './scripts/hmr-plugin';

const require = createRequire(import.meta.url);
const enableIstanbul = !!process.env.COVERAGE;
const chunkSizeReport = !!process.env.CHUNK_SIZE_REPORT;

const cache = new Map();

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

type GetModuleInfo = Parameters<GetManualChunk>[1]['getModuleInfo'];

function isDepInclude(
  id: string,
  depPaths: string[],
  importChain: string[],
  getModuleInfo: GetModuleInfo
): boolean | undefined {
  const key = `${id}-${depPaths.join('|')}`;
  if (importChain.includes(id)) {
    cache.set(key, false);
    return false;
  }
  if (cache.has(key)) {
    return cache.get(key);
  }
  for (const depPath of depPaths) {
    if (id.includes(depPath)) {
      importChain.forEach(item =>
        cache.set(`${item}-${depPaths.join('|')}`, true)
      );
      return true;
    }
  }
  const moduleInfo = getModuleInfo(id);
  if (!moduleInfo || !moduleInfo.importers) {
    cache.set(key, false);
    return false;
  }
  const isInclude = moduleInfo.importers.some(importer =>
    isDepInclude(importer, depPaths, importChain.concat(id), getModuleInfo)
  );
  cache.set(key, isInclude);
  return isInclude;
}

const chunkGroups = {
  framework: [
    require.resolve('@blocksuite/block-std'),
    require.resolve('@blocksuite/global'),
    require.resolve('@blocksuite/global/utils'),
    require.resolve('@blocksuite/global/env'),
    require.resolve('@blocksuite/global/exceptions'),
    require.resolve('@blocksuite/inline'),
    require.resolve('@blocksuite/store'),
    require.resolve('@blocksuite/sync'),
  ],
  datefns: [path.dirname(require.resolve('date-fns'))],
  dompurify: [path.dirname(require.resolve('dompurify'))],
  shiki: [path.dirname(require.resolve('@shikijs/core'))],
  dotLottie: [path.dirname(require.resolve('@dotlottie/player-component'))],
  unified: [
    path.dirname(require.resolve('unified')),
    path.dirname(require.resolve('rehype-parse')),
    path.dirname(require.resolve('rehype-stringify')),
    path.dirname(require.resolve('remark-parse')),
    path.dirname(require.resolve('remark-stringify')),
    path.dirname(require.resolve('mdast-util-gfm-autolink-literal')),
    path.dirname(require.resolve('mdast-util-gfm-strikethrough')),
    path.dirname(require.resolve('mdast-util-gfm-table')),
    path.dirname(require.resolve('mdast-util-gfm-task-list-item')),
    path.dirname(require.resolve('micromark-extension-gfm-autolink-literal')),
    path.dirname(require.resolve('micromark-extension-gfm-strikethrough')),
    path.dirname(require.resolve('micromark-extension-gfm-table')),
    path.dirname(require.resolve('micromark-extension-gfm-task-list-item')),
    path.dirname(require.resolve('micromark-util-combine-extensions')),
  ],
  ai: [
    path.dirname(require.resolve('@fal-ai/serverless-client')),
    path.dirname(require.resolve('openai')),
  ],
  blocks: [
    require.resolve('@blocksuite/blocks'),
    require.resolve('@blocksuite/blocks/schemas'),
  ],
  presets: [require.resolve('@blocksuite/presets')],
};

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
    ],
    esbuild: {
      target: 'es2018',
    },
    build: {
      target: 'ES2022',
      sourcemap: true,
      rollupOptions: {
        cache: false,
        maxParallelFileOps: Math.max(1, cpus().length - 1),
        onwarn(warning, defaultHandler) {
          if (['SOURCEMAP_ERROR', 'EVAL'].includes(warning.code)) {
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
          'examples/store': resolve(__dirname, 'examples/store/index.html'),
          'examples/provider': resolve(
            __dirname,
            'examples/provider/index.html'
          ),
        },
        output: {
          sourcemapIgnoreList: relativeSourcePath => {
            const normalizedPath = path.normalize(relativeSourcePath);
            return normalizedPath.includes('node_modules');
          },
          manualChunks(id, { getModuleInfo }) {
            for (const group of Object.keys(chunkGroups)) {
              const deps = chunkGroups[group];
              if (isDepInclude(id, deps, [], getModuleInfo)) {
                if (chunkSizeReport && id.includes('node_modules')) {
                  console.log(group + ':', id);
                  console.log(
                    group + ':',
                    fs.statSync(id.replace('\x00', '').replace(/\?.*/, ''))
                      .size / 1024,
                    'KB'
                  );
                }
                return group;
              }
            }
          },
        },
      },
    },
  });
};
