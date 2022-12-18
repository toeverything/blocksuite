import { basename, resolve } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import type {
  ModuleFormat,
  OutputOptions,
  RollupCache,
  RollupOptions,
} from 'rollup';
import { fileURLToPath } from 'url';
import dts from 'rollup-plugin-dts';
import { defineRollupSwcOption, swc } from 'rollup-plugin-swc3';

let cache: RollupCache;

const dtsOutput = new Set<[string, string]>();

const outputDir = fileURLToPath(new URL('.', import.meta.url));
const external: string[] = [];

const outputMatrix = (
  name: string,
  format: ModuleFormat[] = ['es', 'umd']
): OutputOptions[] => {
  const baseName = basename(name);
  return format.flatMap(format => ({
    file: resolve(outputDir, `${baseName}.${format === 'es' ? 'm' : ''}js`),
    sourcemap: false,
    name: 'DevKit',
    format,
    banner: `/// <reference types="./${baseName}.d.ts" />`,
    globals: external.reduce((object, module) => {
      object[module] = module;
      return object;
    }, {} as Record<string, string>),
  }));
};

const buildMatrix = (input: string, output: string): RollupOptions => {
  dtsOutput.add([input, output]);
  return {
    input,
    output: outputMatrix(output),
    cache,
    external,
    plugins: [
      commonjs({
        esmExternals: true,
      }),
      nodeResolve({
        exportConditions: ['import', 'require', 'default'],
      }),
      swc(
        defineRollupSwcOption({
          jsc: {
            externalHelpers: true,
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
                importSource: '@emotion/react',
              },
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
  buildMatrix('./src/shape.ts', 'shape'),
  ...dtsMatrix(),
];

export default build;
