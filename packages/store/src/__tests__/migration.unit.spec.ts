/* eslint-disable @typescript-eslint/no-restricted-imports */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { assert, describe, expect, test } from 'vitest';
import * as Y from 'yjs';

// Use manual per-module import/export to support vitest environment on Node.js
import { DatabaseBlockSchema } from '../../../blocks/src/database-block/database-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { NoteBlockSchema } from '../../../blocks/src/note-block/note-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../../../blocks/src/surface-block/surface-model.js';
// normal import
import { Schema } from '../schema/schema.js';

async function loadBinary(name: string) {
  const url = new URL(`./ydocs/${name}.ydoc`, import.meta.url);
  const path = fileURLToPath(url);
  const buffer = await readFile(path);
  const update = new Uint8Array(buffer);
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc;
}

const schema = new Schema();
schema.register([
  PageBlockSchema,
  SurfaceBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  DatabaseBlockSchema,
]);

describe('workspace migration', () => {
  test('add pageVersion in workspace meta', async () => {
    const doc = await loadBinary('workspace-v1-v2');

    const meta = doc.getMap('meta');
    const before = meta.toJSON();
    assert.equal(before['workspaceVersion'], 1);
    assert.isUndefined(before['pageVersion']);

    schema.upgradeWorkspace(doc);

    const after = meta.toJSON();
    assert.equal(after['workspaceVersion'], 2);
    assert.equal(after['pageVersion'], 1);
  });
});

describe('block migration', () => {
  test('update shape and text element, `isBold` -> `bold`, `isItalic` -> `italic`, surface v3 -> v4', async () => {
    const doc = await loadBinary('page-surface-v3-v4');

    // @ts-ignore
    let surfaceElements = doc
      .getMap('blocks')
      .get('zUHGq4EHQJ')
      .get('prop:elements') as Y.Map<unknown>;
    let text = surfaceElements.get('Cj2MNGM9UK') as Y.Map<unknown>;
    let shape = surfaceElements.get('Rl2IT9rGoP') as Y.Map<unknown>;

    assert.equal(text.get('isBold'), true);
    assert.equal(text.get('isItalic'), true);
    assert.equal(text.get('text').toJSON(), 'aaa');
    assert.isUndefined(text.get('bold'));
    assert.isUndefined(text.get('italic'));

    assert.equal(shape.get('isBold'), true);
    assert.equal(shape.get('isItalic'), true);
    assert.isUndefined(shape.get('bold'));
    assert.isUndefined(shape.get('italic'));

    schema.upgradePage(
      {
        'affine:page': 1,
        'affine:note': 1,
        'affine:paragraph': 1,
        'affine:surface': 3,
      },
      doc
    );

    // @ts-ignore
    surfaceElements = doc
      .getMap('blocks')
      .get('zUHGq4EHQJ')
      .get('prop:elements')
      .get('value') as Y.Map<unknown>;
    text = surfaceElements.get('Cj2MNGM9UK') as Y.Map<unknown>;
    shape = surfaceElements.get('Rl2IT9rGoP') as Y.Map<unknown>;

    assert.isUndefined(text.get('isBold'));
    assert.isUndefined(text.get('isItalic'));
    assert.equal(text.get('bold'), true);
    assert.equal(text.get('italic'), true);
    assert.equal(text.get('text').toJSON(), 'aaa');

    assert.isUndefined(shape.get('isBold'));
    assert.isUndefined(shape.get('isItalic'));
    assert.equal(shape.get('bold'), true);
    assert.equal(shape.get('italic'), true);
  });

  test('fix wrong connector data', async () => {
    const doc = await loadBinary('connector');
    // @ts-ignore
    const surfaceElements = doc
      .getMap('blocks')
      .get('BOpLR3siGx')
      .get('prop:elements') as Y.Map<unknown>;

    let connector = surfaceElements.get('Gt8_2oZB8h') as Y.Map<unknown>;

    assert.exists(connector);

    schema.upgradePage(
      {
        'affine:list': 1,
        'affine:page': 1,
        'affine:note': 1,
        'affine:paragraph': 1,
        'affine:surface': 3,
      },
      doc
    );

    connector = surfaceElements.get('Gt8_2oZB8h') as Y.Map<unknown>;

    assert.notExists(connector);
  });

  test('update database block title data', async () => {
    const doc = await loadBinary('page-database-v2-v3');

    let databaseBlock = (
      doc.getMap('blocks').get('Y76JkP9XRn') as Y.Map<unknown>
    ).toJSON();
    expect(databaseBlock['prop:titleColumnName']).toBe('Title');
    expect(databaseBlock['prop:titleColumnWidth']).toBe(200);
    expect(
      databaseBlock['prop:columns'].find(
        (v: Record<string, unknown>) => v.type === 'title'
      )
    ).toBeUndefined();
    expect(databaseBlock['prop:views'].length).toBe(2);
    // migratePageBlock(doc, {
    //   'affine:database': 2,
    // });
    schema.upgradePage(
      {
        'affine:page': 1,
        'affine:surface': 4,
        'affine:note': 1,
        'affine:paragraph': 1,
        'affine:database': 2,
      },
      doc
    );
    databaseBlock = (
      doc.getMap('blocks').get('Y76JkP9XRn') as Y.Map<unknown>
    ).toJSON();
    expect(databaseBlock['prop:titleColumnName']).toBeUndefined();
    expect(databaseBlock['prop:titleColumnWidth']).toBeUndefined();
    const titleColumn = databaseBlock['prop:columns'].find(
      (v: Record<string, unknown>) => v.type === 'title'
    );
    expect(titleColumn.type).toBe('title');
    for (const view of databaseBlock['prop:views']) {
      if (view['mode'] === 'table') {
        expect(
          view['columns'].find(
            (v: Record<string, unknown>) => v.id === titleColumn.id
          ).width
        ).toBe(200);
      }
    }
  });
});
