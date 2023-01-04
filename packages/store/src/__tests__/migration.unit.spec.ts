import * as Y from 'yjs';
import { describe, assert, test, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { tryMigrate } from '../workspace/migrations.js';

async function loadBinary(name: string) {
  const url = new URL(`./ydocs/${name}.ydoc`, import.meta.url);
  const path = fileURLToPath(url);
  const buffer = await readFile(path);
  const update = new Uint8Array(buffer);
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc;
}

describe('migration', () => {
  test('migrate from group to frame', async () => {
    const doc = await loadBinary('legacy-group');
    tryMigrate(doc);

    const result = doc.toJSON();
    assert.deepEqual(result['space:meta']['versions'], {
      'affine:paragraph': 1,
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:shape': 1,
      'affine:code': 1,
      'affine:surface': 1,
    });

    assert.equal(
      result['space:page0']['2350844747:1']['sys:flavour'],
      'affine:frame'
    );

    const blockIds = Object.keys(result['space:page0']);
    assert.equal(blockIds.length, 5);
    assert.equal(
      blockIds.findIndex(key => result['space:page0'][key] === 'affine:group'),
      -1
    );
  });

  test('migrate add surface', async () => {
    const doc = await loadBinary('legacy-surface');
    tryMigrate(doc);

    const result = doc.toJSON();
    assert.deepEqual(result['space:meta']['versions'], {
      'affine:paragraph': 1,
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:shape': 1,
      'affine:code': 1,
      'affine:surface': 1,
    });
    let hasSurface = false;
    Object.entries(result['space:page0']).map(
      ([key, value]: [string, unknown]) => {
        if (
          (value as Record<string, unknown>)['sys:flavour'] === 'affine:surface'
        ) {
          hasSurface = true;
        }
      }
    );
    expect(hasSurface).toBe(true);
  });
});
