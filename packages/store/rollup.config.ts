/// <reference types="node" />
import { basename, resolve } from 'node:path';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import type {
  ModuleFormat,
  OutputOptions,
  RollupCache,
  RollupOptions,
} from 'rollup';
import dts from 'rollup-plugin-dts';
import { defineRollupSwcOption, swc } from 'rollup-plugin-swc3';
import { fileURLToPath } from 'url';

let cache: RollupCache;

const dtsOutput = new Set<[string, string]>();

const outputDir = fileURLToPath(new URL('dist', import.meta.url));

const outputMatrix = (
  name: string,
  format: ModuleFormat[]
): OutputOptions[] => {
  const baseName = basename(name);
  return format.flatMap(format => ({
    file: resolve(outputDir, `${baseName}.${format === 'es' ? 'm' : ''}js`),
    sourcemap: false,
    name: 'BlockSuiteStore',
    format,
    banner: `/// <reference types="./${baseName}.d.ts" />`,
  }));
};

const buildMatrix = (
  input: string,
  output: string,
  config: {
    format: ModuleFormat[];
    browser: boolean;
    dts: boolean;
  }
): RollupOptions => {
  if (config.dts) {
    dtsOutput.add([input, output]);
  }
  return {
    input,
    output: outputMatrix(output, config.format),
    cache,
    external: [
      'buffer',
      'flexsearch',
      'idb-keyval',
      'ky',
      /^lib0/,
      'sha3',
      'y-indexeddb',
      /^y-protocols/,
      'y-webrtc',
      'y-websocket',
      'yjs',
    ],
    plugins: [
      alias({}),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      commonjs({
        esmExternals: true,
      }),
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ['import', 'require', 'default'],
      }),
      swc(
        defineRollupSwcOption({
          jsc: {
            externalHelpers: true,
            parser: {
              syntax: 'typescript',
            },
          },
        })
      ),
    ],
  };
};

const dtsMatrix = (): RollupOptions[] => {
  return [...dtsOutput.values()].flatMap(([input, output]) => ({
    input,
    cache,
    output: {
      file: resolve(outputDir, `${output}.d.ts`),
      format: 'es',
    },
    plugins: [dts()],
  }));
};

const build: RollupOptions[] = [
  buildMatrix('./src/index.ts', 'index', {
    format: ['es', 'umd'],
    browser: false,
    dts: true,
  }),
  ...dtsMatrix(),
];

export default build;
