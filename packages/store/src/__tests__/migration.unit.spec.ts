import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { assert, describe, expect, test } from 'vitest';
import * as Y from 'yjs';

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
      'affine:page': 1,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 1,
    });

    assert.equal(
      result['space:page0']['2350844747:1']['sys:flavour'],
      'affine:frame'
    );

    const blockIds = Object.keys(result['space:page0']);
    assert.equal(blockIds.length, 6);
    assert.equal(
      blockIds.findIndex(key => result['space:page0'][key] === 'affine:group'),
      -1
    );
  });

  test('migrate to surface block', async () => {
    const doc = await loadBinary('legacy-surface');
    tryMigrate(doc);

    const result = doc.toJSON();
    assert.deepEqual(result['space:meta']['versions'], {
      'affine:paragraph': 1,
      'affine:page': 1,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 1,
    });
    const hasSurface = Object.entries(result['space:page0']).some(
      ([_, value]: [string, unknown]) =>
        (value as Record<string, unknown>)['sys:flavour'] === 'affine:surface'
    );

    const hasShape = Object.entries(result['space:page0']).some(
      ([_, value]: [string, unknown]) =>
        (value as Record<string, unknown>)['sys:flavour'] === 'affine:shape'
    );

    expect(hasSurface).toBe(true);
    expect(hasShape).toBe(false);
  });

  test('migrate to new page title', async () => {
    const doc = await loadBinary('legacy-page-title');

    assert.equal(
      doc.getMap('space:page0').toJSON()['624813625:0']['prop:title'],
      'Welcome to BlockSuite playground'
    );
    assert.equal(
      doc.getMap('space:meta').toJSON()['pages'][0]['title'],
      'Welcome to BlockSuite playground'
    );
  });
});
