import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { assert, describe, test } from 'vitest';
import * as Y from 'yjs';

import { migrateWorkspace } from '../migrate-workspace.js';
import { migratePageBlock } from '../mirgrate-block.js';

async function loadBinary(name: string) {
  const url = new URL(`./ydocs/${name}.ydoc`, import.meta.url);
  const path = fileURLToPath(url);
  const buffer = await readFile(path);
  const update = new Uint8Array(buffer);
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc;
}

describe('workspace migration', () => {
  test('add pageVersion in workspace meta', async () => {
    const doc = await loadBinary('workspace-v1-v2');

    const meta = doc.getMap('meta');
    const before = meta.toJSON();
    assert.equal(before['workspaceVersion'], 1);
    assert.isUndefined(before['pageVersion']);

    migrateWorkspace(doc);

    const after = meta.toJSON();
    assert.equal(after['workspaceVersion'], 2);
    assert.equal(after['pageVersion'], 1);
  });
});

describe('block migration', () => {
  test('update shape and text element, `isBold` -> `bold`, `isItalic` -> `italic`, surface v3 -> v4', async () => {
    const doc = await loadBinary('page-surface-v3-v4');

    // @ts-ignore
    const surfaceElements = doc
      .getMap('blocks')
      .get('zUHGq4EHQJ')
      .get('prop:elements') as Y.Map<unknown>;
    const text = surfaceElements.get('Cj2MNGM9UK') as Y.Map<unknown>;
    const shape = surfaceElements.get('Rl2IT9rGoP') as Y.Map<unknown>;

    assert.equal(text.get('isBold'), true);
    assert.equal(text.get('isItalic'), true);
    assert.isUndefined(text.get('bold'));
    assert.isUndefined(text.get('italic'));

    assert.equal(shape.get('isBold'), true);
    assert.equal(shape.get('isItalic'), true);
    assert.isUndefined(shape.get('bold'));
    assert.isUndefined(shape.get('italic'));

    migratePageBlock(doc, {
      surface: 3,
    });

    assert.isUndefined(text.get('isBold'));
    assert.isUndefined(text.get('isItalic'));
    assert.equal(text.get('bold'), true);
    assert.equal(text.get('italic'), true);

    assert.isUndefined(shape.get('isBold'));
    assert.isUndefined(shape.get('isItalic'));
    assert.equal(shape.get('bold'), true);
    assert.equal(shape.get('italic'), true);
  });
});
