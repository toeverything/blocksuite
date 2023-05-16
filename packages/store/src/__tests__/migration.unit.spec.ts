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
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 3,
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
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 3,
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

  test('migrate to new page title (v1 -> v2)', async () => {
    const doc = await loadBinary('legacy-page-title');

    const oldTitle = (
      doc.getMap('space:page0').get('624813625:0') as Y.Map<unknown>
    ).get('prop:title');

    tryMigrate(doc);
    assert.deepEqual(doc.toJSON()['space:meta']['versions'], {
      'affine:paragraph': 1,
      'affine:database': 1,
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 3,
    });

    const newTitle = (
      doc.getMap('space:page0').get('624813625:0') as Y.Map<unknown>
    ).get('prop:title') as Y.Text;

    assert.isString(oldTitle);
    assert.instanceOf(newTitle, Y.Text);
    assert.equal(oldTitle, newTitle.toString());
  });

  test('migrate to new surface (v1 -> v2)', async () => {
    const doc = await loadBinary('legacy-surface-seed');

    const oldElement = (
      (doc.getMap('space:page0').get('529852219:1') as Y.Map<unknown>).get(
        'elements'
      ) as Y.Map<Y.Map<unknown>>
    ).get('2NglrfVtaF');

    assert.deepEqual(oldElement?.toJSON(), {
      type: 'shape',
      xywh: '[615.59375,-11.80078125,226.73046875,340.609375]',
      shapeType: 'rect',
      radius: 0,
      filled: false,
      fillColor: '--affine-palette-transparent',
      strokeWidth: 4,
      strokeColor: '--affine-palette-line-black',
      strokeStyle: 'solid',
      id: '2NglrfVtaF',
      index: 'a3',
    });

    tryMigrate(doc);
    assert.deepEqual(doc.toJSON()['space:meta']['versions'], {
      'affine:paragraph': 1,
      'affine:database': 1,
      'affine:page': 2,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 3,
    });

    const newElement = (
      (doc.getMap('space:page0').get('529852219:1') as Y.Map<unknown>).get(
        'elements'
      ) as Y.Map<Y.Map<unknown>>
    ).get('2NglrfVtaF');

    assert.deepEqual(newElement?.toJSON(), {
      ...oldElement?.toJSON(),
      seed: newElement?.get('seed'),
    });
  });
});
