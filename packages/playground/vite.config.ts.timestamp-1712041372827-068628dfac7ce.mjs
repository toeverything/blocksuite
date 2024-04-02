// vite.config.ts
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defineConfig,
  loadEnv,
} from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/vite@5.2.6_@types+node@20.11.30_terser@5.29.2/node_modules/vite/dist/node/index.js';
import istanbul from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/vite-plugin-istanbul@6.0.0_vite@5.2.6/node_modules/vite-plugin-istanbul/dist/index.mjs';
import wasm from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/vite-plugin-wasm@3.3.0_vite@5.2.6/node_modules/vite-plugin-wasm/exports/import.mjs';

// scripts/hmr-plugin/index.ts
import path2 from 'node:path';
import {
  hmrPlugin as wcHmrPlugin,
  presets,
} from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/vite-plugin-web-components-hmr@0.1.3_vite@5.2.6/node_modules/vite-plugin-web-components-hmr/index.mjs';

// scripts/hmr-plugin/fine-tune.ts
import path from 'node:path';
import {
  init,
  parse,
} from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/es-module-lexer@1.4.2/node_modules/es-module-lexer/dist/lexer.js';
import MagicString from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/magic-string@0.30.8/node_modules/magic-string/dist/magic-string.es.mjs';
import micromatch from 'file:///Users/fundon/dev/toeverything/blocksuite/node_modules/.pnpm/micromatch@4.0.5/node_modules/micromatch/index.js';
var isMatch = micromatch.isMatch;
function fineTuneHmr({ include: include2, exclude: exclude2 }) {
  let root = '';
  const plugin = {
    name: 'add-hot-for-pure-exports',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    async configureServer() {
      await init;
    },
    transform: (code, id) => {
      const includeGlob = include2.map(i => path.resolve(root, i));
      const excludeGlob = exclude2.map(i => path.resolve(root, i));
      const isInScope = isMatch(id, includeGlob) && !isMatch(id, excludeGlob);
      if (!isInScope) return;
      if (!(id.endsWith('.js') || id.endsWith('.ts'))) return;
      if (code.includes('import.meta.hot')) return;
      const [imports, exports] = parse(code, id);
      if (exports.length === 0 && imports.length > 0) {
        const modules = imports.map(i => i.n);
        const modulesEndsWithTs = modules
          .filter(Boolean)
          .map(m => m.replace(/\.js$/, '.ts'));
        const preamble = `
          if (import.meta.hot) {
            import.meta.hot.accept(${JSON.stringify(
              modulesEndsWithTs
            )}, data => {
              // some update logic
            });
          }
          `;
        const s = new MagicString(code);
        s.prepend(preamble + '\n');
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id, includeContent: true }),
        };
      }
      return;
    },
  };
  return plugin;
}

// scripts/hmr-plugin/index.ts
var __vite_injected_original_dirname =
  '/Users/fundon/dev/toeverything/blocksuite/packages/playground/scripts/hmr-plugin';
var customLitPath = path2.resolve(
  __vite_injected_original_dirname,
  '../../../blocks/src/_legacy/index.js'
);
var include = ['../blocks/src/**/*'];
var exclude = ['**/*/node_modules/**/*'];
var hmrPlugin = process.env.WC_HMR
  ? [
      wcHmrPlugin({
        include,
        exclude,
        presets: [presets.lit],
        decorators: [{ name: 'customElement', import: 'lit/decorators.js' }],
        baseClasses: [
          {
            name: 'ShadowlessElement',
            import: customLitPath,
          },
        ],
      }),
      fineTuneHmr({
        include,
        exclude,
      }),
    ]
  : [];

// vite.config.ts
var __vite_injected_original_dirname2 =
  '/Users/fundon/dev/toeverything/blocksuite/packages/playground';
var __vite_injected_original_import_meta_url =
  'file:///Users/fundon/dev/toeverything/blocksuite/packages/playground/vite.config.ts';
var require2 = createRequire(__vite_injected_original_import_meta_url);
var enableIstanbul = !!process.env.CI || !!process.env.COVERAGE;
var cache = /* @__PURE__ */ new Map();
function isDepInclude(id, depPaths, importChain, getModuleInfo) {
  const key = `${id}-${depPaths.join('|')}`;
  if (importChain.includes(id)) {
    cache.set(key, false);
    return false;
  }
  if (cache.has(key)) {
    return cache.get(key);
  }
  if (depPaths.includes(id)) {
    importChain.forEach(item =>
      cache.set(`${item}-${depPaths.join('|')}`, true)
    );
    return true;
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
var chunkGroups = {
  framework: [
    require2.resolve('@blocksuite/block-std'),
    require2.resolve('@blocksuite/global'),
    require2.resolve('@blocksuite/global/utils'),
    require2.resolve('@blocksuite/global/env'),
    require2.resolve('@blocksuite/global/exceptions'),
    require2.resolve('@blocksuite/inline'),
    require2.resolve('@blocksuite/store'),
    require2.resolve('@blocksuite/sync'),
  ],
  blocks: [
    require2.resolve('@blocksuite/blocks'),
    require2.resolve('@blocksuite/blocks/schemas'),
  ],
  presets: [require2.resolve('@blocksuite/presets')],
};
var vite_config_default = ({ mode }) => {
  process.env = {
    ...process.env,
    ...loadEnv(mode, __vite_injected_original_dirname2, ''),
  };
  return defineConfig({
    envDir: __vite_injected_original_dirname2,
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
      enableIstanbul &&
        istanbul({
          cwd: fileURLToPath(
            new URL('../..', __vite_injected_original_import_meta_url)
          ),
          include: ['packages/**/src/*'],
          exclude: [
            'node_modules',
            'tests',
            fileURLToPath(
              new URL('.', __vite_injected_original_import_meta_url)
            ),
          ],
          forceBuildInstrument: true,
        }),
      wasm(),
    ],
    build: {
      target: 'ES2022',
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__vite_injected_original_dirname2, 'index.html'),
          'starter/': resolve(
            __vite_injected_original_dirname2,
            'starter/index.html'
          ),
          'examples/basic/page': resolve(
            __vite_injected_original_dirname2,
            'examples/basic/page/index.html'
          ),
          'examples/basic/edgeless': resolve(
            __vite_injected_original_dirname2,
            'examples/basic/edgeless/index.html'
          ),
          'examples/multiple-editors/page-page': resolve(
            __vite_injected_original_dirname2,
            'examples/multiple-editors/page-page/index.html'
          ),
          'examples/multiple-editors/page-edgeless': resolve(
            __vite_injected_original_dirname2,
            'examples/multiple-editors/page-edgeless/index.html'
          ),
          'examples/multiple-editors/edgeless-edgeless': resolve(
            __vite_injected_original_dirname2,
            'examples/multiple-editors/edgeless-edgeless/index.html'
          ),
          'examples/inline': resolve(
            __vite_injected_original_dirname2,
            'examples/inline/index.html'
          ),
          'examples/store': resolve(
            __vite_injected_original_dirname2,
            'examples/store/index.html'
          ),
          'examples/provider': resolve(
            __vite_injected_original_dirname2,
            'examples/provider/index.html'
          ),
        },
        output: {
          manualChunks(id, { getModuleInfo }) {
            for (const group of Object.keys(chunkGroups)) {
              const deps = chunkGroups[group];
              if (isDepInclude(id, deps, [], getModuleInfo)) {
                return group;
              }
            }
          },
        },
      },
    },
  });
};
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2NyaXB0cy9obXItcGx1Z2luL2luZGV4LnRzIiwgInNjcmlwdHMvaG1yLXBsdWdpbi9maW5lLXR1bmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZnVuZG9uL2Rldi90b2V2ZXJ5dGhpbmcvYmxvY2tzdWl0ZS9wYWNrYWdlcy9wbGF5Z3JvdW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZnVuZG9uL2Rldi90b2V2ZXJ5dGhpbmcvYmxvY2tzdWl0ZS9wYWNrYWdlcy9wbGF5Z3JvdW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9mdW5kb24vZGV2L3RvZXZlcnl0aGluZy9ibG9ja3N1aXRlL3BhY2thZ2VzL3BsYXlncm91bmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSAnbm9kZTptb2R1bGUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCBpc3RhbmJ1bCBmcm9tICd2aXRlLXBsdWdpbi1pc3RhbmJ1bCc7XG5pbXBvcnQgd2FzbSBmcm9tICd2aXRlLXBsdWdpbi13YXNtJztcblxuaW1wb3J0IHsgaG1yUGx1Z2luIH0gZnJvbSAnLi9zY3JpcHRzL2htci1wbHVnaW4nO1xuXG5jb25zdCByZXF1aXJlID0gY3JlYXRlUmVxdWlyZShpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgZW5hYmxlSXN0YW5idWwgPSAhIXByb2Nlc3MuZW52LkNJIHx8ICEhcHJvY2Vzcy5lbnYuQ09WRVJBR0U7XG5cbmNvbnN0IGNhY2hlID0gbmV3IE1hcCgpO1xuXG5mdW5jdGlvbiBpc0RlcEluY2x1ZGUoXG4gIGlkOiBzdHJpbmcsXG4gIGRlcFBhdGhzOiBzdHJpbmdbXSxcbiAgaW1wb3J0Q2hhaW46IHN0cmluZ1tdLFxuICBnZXRNb2R1bGVJbmZvXG4pOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qga2V5ID0gYCR7aWR9LSR7ZGVwUGF0aHMuam9pbignfCcpfWA7XG4gIGlmIChpbXBvcnRDaGFpbi5pbmNsdWRlcyhpZCkpIHtcbiAgICBjYWNoZS5zZXQoa2V5LCBmYWxzZSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChjYWNoZS5oYXMoa2V5KSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQoa2V5KTtcbiAgfVxuICBpZiAoZGVwUGF0aHMuaW5jbHVkZXMoaWQpKSB7XG4gICAgaW1wb3J0Q2hhaW4uZm9yRWFjaChpdGVtID0+XG4gICAgICBjYWNoZS5zZXQoYCR7aXRlbX0tJHtkZXBQYXRocy5qb2luKCd8Jyl9YCwgdHJ1ZSlcbiAgICApO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGNvbnN0IG1vZHVsZUluZm8gPSBnZXRNb2R1bGVJbmZvKGlkKTtcbiAgaWYgKCFtb2R1bGVJbmZvIHx8ICFtb2R1bGVJbmZvLmltcG9ydGVycykge1xuICAgIGNhY2hlLnNldChrZXksIGZhbHNlKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgaXNJbmNsdWRlID0gbW9kdWxlSW5mby5pbXBvcnRlcnMuc29tZShpbXBvcnRlciA9PlxuICAgIGlzRGVwSW5jbHVkZShpbXBvcnRlciwgZGVwUGF0aHMsIGltcG9ydENoYWluLmNvbmNhdChpZCksIGdldE1vZHVsZUluZm8pXG4gICk7XG4gIGNhY2hlLnNldChrZXksIGlzSW5jbHVkZSk7XG4gIHJldHVybiBpc0luY2x1ZGU7XG59XG5cbmNvbnN0IGNodW5rR3JvdXBzID0ge1xuICBmcmFtZXdvcms6IFtcbiAgICByZXF1aXJlLnJlc29sdmUoJ0BibG9ja3N1aXRlL2Jsb2NrLXN0ZCcpLFxuICAgIHJlcXVpcmUucmVzb2x2ZSgnQGJsb2Nrc3VpdGUvZ2xvYmFsJyksXG4gICAgcmVxdWlyZS5yZXNvbHZlKCdAYmxvY2tzdWl0ZS9nbG9iYWwvdXRpbHMnKSxcbiAgICByZXF1aXJlLnJlc29sdmUoJ0BibG9ja3N1aXRlL2dsb2JhbC9lbnYnKSxcbiAgICByZXF1aXJlLnJlc29sdmUoJ0BibG9ja3N1aXRlL2dsb2JhbC9leGNlcHRpb25zJyksXG4gICAgcmVxdWlyZS5yZXNvbHZlKCdAYmxvY2tzdWl0ZS9pbmxpbmUnKSxcbiAgICByZXF1aXJlLnJlc29sdmUoJ0BibG9ja3N1aXRlL3N0b3JlJyksXG4gICAgcmVxdWlyZS5yZXNvbHZlKCdAYmxvY2tzdWl0ZS9zeW5jJyksXG4gIF0sXG4gIGJsb2NrczogW1xuICAgIHJlcXVpcmUucmVzb2x2ZSgnQGJsb2Nrc3VpdGUvYmxvY2tzJyksXG4gICAgcmVxdWlyZS5yZXNvbHZlKCdAYmxvY2tzdWl0ZS9ibG9ja3Mvc2NoZW1hcycpLFxuICBdLFxuICBwcmVzZXRzOiBbcmVxdWlyZS5yZXNvbHZlKCdAYmxvY2tzdWl0ZS9wcmVzZXRzJyldLFxufTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0ICh7IG1vZGUgfSkgPT4ge1xuICBwcm9jZXNzLmVudiA9IHsgLi4ucHJvY2Vzcy5lbnYsIC4uLmxvYWRFbnYobW9kZSwgX19kaXJuYW1lLCAnJykgfTtcblxuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcbiAgICBlbnZEaXI6IF9fZGlybmFtZSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuUExBWUdST1VORF9TRVJWRVInOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgcHJvY2Vzcy5lbnYuUExBWUdST1VORF9TRVJWRVIgPz8gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODc4NydcbiAgICAgICksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlBMQVlHUk9VTkRfV1MnOiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgcHJvY2Vzcy5lbnYuUExBWUdST1VORF9XUyA/PyAnd3M6Ly9sb2NhbGhvc3Q6ODc4NydcbiAgICAgICksXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBobXJQbHVnaW4sXG4gICAgICBlbmFibGVJc3RhbmJ1bCAmJlxuICAgICAgICBpc3RhbmJ1bCh7XG4gICAgICAgICAgY3dkOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4uLy4uJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICAgaW5jbHVkZTogWydwYWNrYWdlcy8qKi9zcmMvKiddLFxuICAgICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICAgICdub2RlX21vZHVsZXMnLFxuICAgICAgICAgICAgJ3Rlc3RzJyxcbiAgICAgICAgICAgIGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLicsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgZm9yY2VCdWlsZEluc3RydW1lbnQ6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgd2FzbSgpLFxuICAgIF0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogJ0VTMjAyMicsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgICAgJ3N0YXJ0ZXIvJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzdGFydGVyL2luZGV4Lmh0bWwnKSxcbiAgICAgICAgICAnZXhhbXBsZXMvYmFzaWMvcGFnZSc6IHJlc29sdmUoXG4gICAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgICAnZXhhbXBsZXMvYmFzaWMvcGFnZS9pbmRleC5odG1sJ1xuICAgICAgICAgICksXG4gICAgICAgICAgJ2V4YW1wbGVzL2Jhc2ljL2VkZ2VsZXNzJzogcmVzb2x2ZShcbiAgICAgICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgICAgICdleGFtcGxlcy9iYXNpYy9lZGdlbGVzcy9pbmRleC5odG1sJ1xuICAgICAgICAgICksXG4gICAgICAgICAgJ2V4YW1wbGVzL211bHRpcGxlLWVkaXRvcnMvcGFnZS1wYWdlJzogcmVzb2x2ZShcbiAgICAgICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgICAgICdleGFtcGxlcy9tdWx0aXBsZS1lZGl0b3JzL3BhZ2UtcGFnZS9pbmRleC5odG1sJ1xuICAgICAgICAgICksXG4gICAgICAgICAgJ2V4YW1wbGVzL211bHRpcGxlLWVkaXRvcnMvcGFnZS1lZGdlbGVzcyc6IHJlc29sdmUoXG4gICAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgICAnZXhhbXBsZXMvbXVsdGlwbGUtZWRpdG9ycy9wYWdlLWVkZ2VsZXNzL2luZGV4Lmh0bWwnXG4gICAgICAgICAgKSxcbiAgICAgICAgICAnZXhhbXBsZXMvbXVsdGlwbGUtZWRpdG9ycy9lZGdlbGVzcy1lZGdlbGVzcyc6IHJlc29sdmUoXG4gICAgICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICAgICAnZXhhbXBsZXMvbXVsdGlwbGUtZWRpdG9ycy9lZGdlbGVzcy1lZGdlbGVzcy9pbmRleC5odG1sJ1xuICAgICAgICAgICksXG4gICAgICAgICAgJ2V4YW1wbGVzL2lubGluZSc6IHJlc29sdmUoX19kaXJuYW1lLCAnZXhhbXBsZXMvaW5saW5lL2luZGV4Lmh0bWwnKSxcbiAgICAgICAgICAnZXhhbXBsZXMvc3RvcmUnOiByZXNvbHZlKF9fZGlybmFtZSwgJ2V4YW1wbGVzL3N0b3JlL2luZGV4Lmh0bWwnKSxcbiAgICAgICAgICAnZXhhbXBsZXMvcHJvdmlkZXInOiByZXNvbHZlKFxuICAgICAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAgICAgJ2V4YW1wbGVzL3Byb3ZpZGVyL2luZGV4Lmh0bWwnXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkLCB7IGdldE1vZHVsZUluZm8gfSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBncm91cCBvZiBPYmplY3Qua2V5cyhjaHVua0dyb3VwcykpIHtcbiAgICAgICAgICAgICAgY29uc3QgZGVwcyA9IGNodW5rR3JvdXBzW2dyb3VwXTtcbiAgICAgICAgICAgICAgaWYgKGlzRGVwSW5jbHVkZShpZCwgZGVwcywgW10sIGdldE1vZHVsZUluZm8pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG59O1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZnVuZG9uL2Rldi90b2V2ZXJ5dGhpbmcvYmxvY2tzdWl0ZS9wYWNrYWdlcy9wbGF5Z3JvdW5kL3NjcmlwdHMvaG1yLXBsdWdpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Z1bmRvbi9kZXYvdG9ldmVyeXRoaW5nL2Jsb2Nrc3VpdGUvcGFja2FnZXMvcGxheWdyb3VuZC9zY3JpcHRzL2htci1wbHVnaW4vaW5kZXgudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Z1bmRvbi9kZXYvdG9ldmVyeXRoaW5nL2Jsb2Nrc3VpdGUvcGFja2FnZXMvcGxheWdyb3VuZC9zY3JpcHRzL2htci1wbHVnaW4vaW5kZXgudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG5pbXBvcnQge1xuICBobXJQbHVnaW4gYXMgd2NIbXJQbHVnaW4sXG4gIHByZXNldHMsXG59IGZyb20gJ3ZpdGUtcGx1Z2luLXdlYi1jb21wb25lbnRzLWhtcic7XG5cbmltcG9ydCB7IGZpbmVUdW5lSG1yIH0gZnJvbSAnLi9maW5lLXR1bmUuanMnO1xuXG5jb25zdCBjdXN0b21MaXRQYXRoID0gcGF0aC5yZXNvbHZlKFxuICBfX2Rpcm5hbWUsXG4gICcuLi8uLi8uLi9ibG9ja3Mvc3JjL19sZWdhY3kvaW5kZXguanMnXG4pO1xuXG5jb25zdCBpbmNsdWRlID0gWycuLi9ibG9ja3Mvc3JjLyoqLyonXTtcbmNvbnN0IGV4Y2x1ZGUgPSBbJyoqLyovbm9kZV9tb2R1bGVzLyoqLyonXTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBjb25zdCBobXJQbHVnaW4gPSBwcm9jZXNzLmVudi5XQ19ITVJcbiAgPyBbXG4gICAgICB3Y0htclBsdWdpbih7XG4gICAgICAgIGluY2x1ZGUsXG4gICAgICAgIGV4Y2x1ZGUsXG4gICAgICAgIHByZXNldHM6IFtwcmVzZXRzLmxpdF0sXG4gICAgICAgIGRlY29yYXRvcnM6IFt7IG5hbWU6ICdjdXN0b21FbGVtZW50JywgaW1wb3J0OiAnbGl0L2RlY29yYXRvcnMuanMnIH1dLFxuICAgICAgICBiYXNlQ2xhc3NlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdTaGFkb3dsZXNzRWxlbWVudCcsXG4gICAgICAgICAgICBpbXBvcnQ6IGN1c3RvbUxpdFBhdGgsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgZmluZVR1bmVIbXIoe1xuICAgICAgICBpbmNsdWRlLFxuICAgICAgICBleGNsdWRlLFxuICAgICAgfSksXG4gICAgXVxuICA6IFtdO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZnVuZG9uL2Rldi90b2V2ZXJ5dGhpbmcvYmxvY2tzdWl0ZS9wYWNrYWdlcy9wbGF5Z3JvdW5kL3NjcmlwdHMvaG1yLXBsdWdpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Z1bmRvbi9kZXYvdG9ldmVyeXRoaW5nL2Jsb2Nrc3VpdGUvcGFja2FnZXMvcGxheWdyb3VuZC9zY3JpcHRzL2htci1wbHVnaW4vZmluZS10dW5lLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9mdW5kb24vZGV2L3RvZXZlcnl0aGluZy9ibG9ja3N1aXRlL3BhY2thZ2VzL3BsYXlncm91bmQvc2NyaXB0cy9obXItcGx1Z2luL2ZpbmUtdHVuZS50c1wiO2ltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmltcG9ydCB7IGluaXQsIHBhcnNlIH0gZnJvbSAnZXMtbW9kdWxlLWxleGVyJztcbmltcG9ydCBNYWdpY1N0cmluZyBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG5pbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ3ZpdGUnO1xuY29uc3QgaXNNYXRjaCA9IG1pY3JvbWF0Y2guaXNNYXRjaDtcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmVUdW5lSG1yKHtcbiAgaW5jbHVkZSxcbiAgZXhjbHVkZSxcbn06IHtcbiAgaW5jbHVkZTogc3RyaW5nW107XG4gIGV4Y2x1ZGU6IHN0cmluZ1tdO1xufSk6IFBsdWdpbiB7XG4gIGxldCByb290ID0gJyc7XG4gIGNvbnN0IHBsdWdpbjogUGx1Z2luID0ge1xuICAgIG5hbWU6ICdhZGQtaG90LWZvci1wdXJlLWV4cG9ydHMnLFxuICAgIGFwcGx5OiAnc2VydmUnLFxuICAgIGNvbmZpZ1Jlc29sdmVkKGNvbmZpZykge1xuICAgICAgcm9vdCA9IGNvbmZpZy5yb290O1xuICAgIH0sXG4gICAgYXN5bmMgY29uZmlndXJlU2VydmVyKCkge1xuICAgICAgYXdhaXQgaW5pdDtcbiAgICB9LFxuICAgIHRyYW5zZm9ybTogKGNvZGUsIGlkKSA9PiB7XG4gICAgICAvLyBvbmx5IGhhbmRsZSBqcy90cyBmaWxlc1xuICAgICAgY29uc3QgaW5jbHVkZUdsb2IgPSBpbmNsdWRlLm1hcChpID0+IHBhdGgucmVzb2x2ZShyb290LCBpKSk7XG4gICAgICBjb25zdCBleGNsdWRlR2xvYiA9IGV4Y2x1ZGUubWFwKGkgPT4gcGF0aC5yZXNvbHZlKHJvb3QsIGkpKTtcbiAgICAgIGNvbnN0IGlzSW5TY29wZSA9IGlzTWF0Y2goaWQsIGluY2x1ZGVHbG9iKSAmJiAhaXNNYXRjaChpZCwgZXhjbHVkZUdsb2IpO1xuICAgICAgaWYgKCFpc0luU2NvcGUpIHJldHVybjtcbiAgICAgIGlmICghKGlkLmVuZHNXaXRoKCcuanMnKSB8fCBpZC5lbmRzV2l0aCgnLnRzJykpKSByZXR1cm47XG4gICAgICAvLyBvbmx5IGhhbmRsZSBmaWxlcyB3aGljaCBub3QgY29udGFpbnMgTGl0IGVsZW1lbnRzXG4gICAgICBpZiAoY29kZS5pbmNsdWRlcygnaW1wb3J0Lm1ldGEuaG90JykpIHJldHVybjtcblxuICAgICAgY29uc3QgW2ltcG9ydHMsIGV4cG9ydHNdID0gcGFyc2UoY29kZSwgaWQpO1xuICAgICAgaWYgKGV4cG9ydHMubGVuZ3RoID09PSAwICYmIGltcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBtb2R1bGVzID0gaW1wb3J0cy5tYXAoaSA9PiBpLm4pO1xuICAgICAgICBjb25zdCBtb2R1bGVzRW5kc1dpdGhUcyA9IG1vZHVsZXNcbiAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgLm1hcChtID0+IG0hLnJlcGxhY2UoL1xcLmpzJC8sICcudHMnKSk7XG4gICAgICAgIGNvbnN0IHByZWFtYmxlID0gYFxuICAgICAgICAgIGlmIChpbXBvcnQubWV0YS5ob3QpIHtcbiAgICAgICAgICAgIGltcG9ydC5tZXRhLmhvdC5hY2NlcHQoJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgbW9kdWxlc0VuZHNXaXRoVHNcbiAgICAgICAgICAgICl9LCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgLy8gc29tZSB1cGRhdGUgbG9naWNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBgO1xuXG4gICAgICAgIGNvbnN0IHMgPSBuZXcgTWFnaWNTdHJpbmcoY29kZSk7XG4gICAgICAgIHMucHJlcGVuZChwcmVhbWJsZSArICdcXG4nKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiBzLnRvU3RyaW5nKCksXG4gICAgICAgICAgbWFwOiBzLmdlbmVyYXRlTWFwKHsgaGlyZXM6IHRydWUsIHNvdXJjZTogaWQsIGluY2x1ZGVDb250ZW50OiB0cnVlIH0pLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIHBsdWdpbjtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVcsU0FBUyxxQkFBcUI7QUFDdlksU0FBUyxlQUFlO0FBQ3hCLFNBQVMscUJBQXFCO0FBRTlCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sY0FBYztBQUNyQixPQUFPLFVBQVU7OztBQ05xWSxPQUFPQSxXQUFVO0FBRXZhO0FBQUEsRUFDRSxhQUFhO0FBQUEsRUFDYjtBQUFBLE9BQ0s7OztBQ0x1WixPQUFPLFVBQVU7QUFFL2EsU0FBUyxNQUFNLGFBQWE7QUFDNUIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxnQkFBZ0I7QUFFdkIsSUFBTSxVQUFVLFdBQVc7QUFFcEIsU0FBUyxZQUFZO0FBQUEsRUFDMUIsU0FBQUM7QUFBQSxFQUNBLFNBQUFDO0FBQ0YsR0FHVztBQUNULE1BQUksT0FBTztBQUNYLFFBQU0sU0FBaUI7QUFBQSxJQUNyQixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxlQUFlLFFBQVE7QUFDckIsYUFBTyxPQUFPO0FBQUEsSUFDaEI7QUFBQSxJQUNBLE1BQU0sa0JBQWtCO0FBQ3RCLFlBQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxXQUFXLENBQUMsTUFBTSxPQUFPO0FBRXZC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Q1A7QUFBQSxNQUNBLGtCQUNFLFNBQVM7QUFBQSxRQUNQLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsUUFDcEQsU0FBUyxDQUFDLG1CQUFtQjtBQUFBLFFBQzdCLFNBQVM7QUFBQSxVQUNQO0FBQUEsVUFDQTtBQUFBLFVBQ0EsY0FBYyxJQUFJLElBQUksS0FBSyx3Q0FBZSxDQUFDO0FBQUEsUUFDN0M7QUFBQSxRQUNBLHNCQUFzQjtBQUFBLE1BQ3hCLENBQUM7QUFBQSxNQUNILEtBQUs7QUFBQSxJQUNQO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsUUFDYixPQUFPO0FBQUEsVUFDTCxNQUFNLFFBQVFBLG1DQUFXLFlBQVk7QUFBQSxVQUNyQyxZQUFZLFFBQVFBLG1DQUFXLG9CQUFvQjtBQUFBLFVBQ25ELHVCQUF1QjtBQUFBLFlBQ3JCQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSwyQkFBMkI7QUFBQSxZQUN6QkE7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsdUNBQXVDO0FBQUEsWUFDckNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLDJDQUEyQztBQUFBLFlBQ3pDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSwrQ0FBK0M7QUFBQSxZQUM3Q0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsbUJBQW1CLFFBQVFBLG1DQUFXLDRCQUE0QjtBQUFBLFVBQ2xFLGtCQUFrQixRQUFRQSxtQ0FBVywyQkFBMkI7QUFBQSxVQUNoRSxxQkFBcUI7QUFBQSxZQUNuQkE7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBLFFBQVE7QUFBQSxVQUNOLGFBQWEsSUFBSSxFQUFFLGNBQWMsR0FBRztBQUNsQyx1QkFBVyxTQUFTLE9BQU8sS0FBSyxXQUFXLEdBQUc7QUFDNUMsb0JBQU0sT0FBTyxZQUFZLEtBQUs7QUFDOUIsa0JBQUksYUFBYSxJQUFJLE1BQU0sQ0FBQyxHQUFHLGFBQWEsR0FBRztBQUM3Qyx1QkFBTztBQUFBLGNBQ1Q7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgImluY2x1ZGUiLCAiZXhjbHVkZSIsICJwYXRoIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgInJlcXVpcmUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiXQp9Cg==
