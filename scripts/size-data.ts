import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { minify } from 'terser';

import { brotliAsync, gzipAsync } from './utils.js';

const root = path.resolve(fileURLToPath(import.meta.url), '../..');
const pkgDir = path.resolve(root, 'packages');
const sizeDir = path.resolve(root, 'temp/size');

interface Preset {
  name: string;
  imports: string[] | string;
  pkg: string;
  entry: string;
}

const presets: Preset[] = [
  {
    name: 'blocks',
    imports: '*',
    pkg: path.resolve(pkgDir, 'blocks'),
    entry: 'dist/index.js',
  },
  {
    name: 'editor',
    imports: '*',
    pkg: path.resolve(pkgDir, 'editor'),
    entry: 'dist/index.js',
  },
  {
    name: 'store',
    imports: '*',
    pkg: path.resolve(pkgDir, 'store'),
    entry: 'dist/index.js',
  },
  {
    name: 'inline',
    imports: '*',
    pkg: path.resolve(pkgDir, 'inline'),
    entry: 'dist/index.js',
  },
];

const tasks: ReturnType<typeof generateBundle>[] = [];
for (const preset of presets) {
  tasks.push(generateBundle(preset));
}

const results = Object.fromEntries(
  (await Promise.all(tasks)).map(r => [r.name, r])
);

await mkdir(sizeDir, { recursive: true });
await writeFile(
  path.resolve(sizeDir, '_packages.json'),
  JSON.stringify(results),
  'utf-8'
);

async function generateBundle(preset: Preset) {
  const entry = path.resolve(preset.pkg, preset.entry);
  const id = 'virtual:entry';
  const content = `export ${
    typeof preset.imports === 'string'
      ? preset.imports
      : `{ ${preset.imports.join(', ')} }`
  } from '${entry}'`;

  const result = await rollup({
    input: id,
    plugins: [
      {
        name: 'size-data-plugin',
        resolveId(_id) {
          if (_id === id) return id;
          return null;
        },
        load(_id) {
          if (_id === id) return content;
          return null;
        },
      },
    ],
    logLevel: 'silent',
  });

  const generated = await result.generate({
    inlineDynamicImports: true,
  });
  const bundled = generated.output[0].code;
  const minified = (
    await minify(bundled, {
      module: true,
      toplevel: true,
    })
  ).code!;

  const size = minified.length;
  const gzip = (await gzipAsync(minified)).length;
  const brotli = (await brotliAsync(minified)).length;

  return {
    name: preset.name,
    size,
    gzip,
    brotli,
  };
}
