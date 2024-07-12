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
  entry: string;
  imports: string | string[];
  name: string;
  pkg: string;
}

const presets: Preset[] = [
  {
    entry: 'dist/index.js',
    imports: '*',
    name: 'blocks',
    pkg: path.resolve(pkgDir, 'blocks'),
  },
  {
    entry: 'dist/index.js',
    imports: '*',
    name: 'editor',
    pkg: path.resolve(pkgDir, 'editor'),
  },
  {
    entry: 'dist/index.js',
    imports: '*',
    name: 'store',
    pkg: path.resolve(pkgDir, 'store'),
  },
  {
    entry: 'dist/index.js',
    imports: '*',
    name: 'inline',
    pkg: path.resolve(pkgDir, 'inline'),
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
    logLevel: 'silent',
    plugins: [
      {
        load(_id) {
          if (_id === id) return content;
          return null;
        },
        name: 'size-data-plugin',
        resolveId(_id) {
          if (_id === id) return id;
          return null;
        },
      },
    ],
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
    brotli,
    gzip,
    name: preset.name,
    size,
  };
}
