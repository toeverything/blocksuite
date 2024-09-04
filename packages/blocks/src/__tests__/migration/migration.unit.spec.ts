import { SurfaceBlockSchema } from '@blocksuite/affine-block-surface';
import {
  DatabaseBlockSchema,
  FrameBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
} from '@blocksuite/affine-model';
import { DocCollection, Schema, type Y } from '@blocksuite/store';
// normal import
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, describe, expect, test } from 'vitest';

async function loadBinary(name: string) {
  const originPath = fileURLToPath(import.meta.url);
  const path = join(originPath, `../ydocs/${name}.ydoc`);
  const buffer = await readFile(path);
  const update = new Uint8Array(buffer);
  const doc = new DocCollection.Y.Doc();
  DocCollection.Y.applyUpdate(doc, update);
  return doc;
}

const schema = new Schema();
schema.register([
  RootBlockSchema,
  SurfaceBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  DatabaseBlockSchema,
  FrameBlockSchema,
]);

describe('collection migration', () => {
  test('add pageVersion in collection meta', async () => {
    const doc = await loadBinary('workspace-v1-v2');

    const meta = doc.getMap('meta');
    const before = meta.toJSON();
    assert.equal(before['workspaceVersion'], 1);
    assert.isUndefined(before['pageVersion']);

    schema.upgradeCollection(doc);

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
    assert.equal((text.get('text') as Y.Text).toJSON(), 'aaa');
    assert.isUndefined(text.get('bold'));
    assert.isUndefined(text.get('italic'));

    assert.equal(shape.get('isBold'), true);
    assert.equal(shape.get('isItalic'), true);
    assert.isUndefined(shape.get('bold'));
    assert.isUndefined(shape.get('italic'));

    schema.upgradeDoc(
      0,
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

    assert.equal((text.get('text') as Y.Text).toJSON(), 'aaa');

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

    schema.upgradeDoc(
      0,
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

  test('frame element to block', async () => {
    const doc = await loadBinary('frame-element-to-block');

    const blocks = doc.getMap('blocks');

    const page = blocks.get('H4fVFXmGUu') as Y.Map<unknown>;

    // @ts-ignore
    const surfaceElements = blocks
      .get('eligOTIQu-')
      .get('prop:elements')
      .get('value') as Y.Map<unknown>;
    assert.exists(surfaceElements.get('2'));

    schema.upgradeDoc(
      0,
      {
        'affine:surface': 5,
      },
      doc
    );

    assert.notExists(surfaceElements.get('2'));
    const pageChildren = page.get('sys:children') as Y.Array<string>;
    const id = pageChildren.get(pageChildren.length - 1);
    assert.equal(id, '2');
    assert.exists(blocks.get(id));
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

    schema.upgradeDoc(
      0,
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
