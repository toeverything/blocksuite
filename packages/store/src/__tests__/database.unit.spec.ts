/* eslint-disable @typescript-eslint/no-restricted-imports */
import { beforeEach, describe, expect, test } from 'vitest';

import { CodeBlockSchema } from '../../../blocks/src/code-block/code-model.js';
import { DatabaseBlockSchema } from '../../../blocks/src/database-block/database-model.js';
import { DividerBlockSchema } from '../../../blocks/src/divider-block/divider-model.js';
import { EmbedBlockSchema } from '../../../blocks/src/embed-block/embed-model.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { ListBlockSchema } from '../../../blocks/src/list-block/list-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../../../blocks/src/surface-block/surface-model.js';
import type { Cell, Column, SelectTag } from '../../../global/src/database.js';
import type { BaseBlockModel, Page } from '../index.js';
import { Generator } from '../index.js';
import { Workspace } from '../index.js';
import type { DatabaseManager } from '../workspace/database.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

const AffineSchemas = [
  CodeBlockSchema,
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
  EmbedBlockSchema,
  SurfaceBlockSchema,
  DatabaseBlockSchema,
];

describe('DatabaseManager', () => {
  let workspace: Workspace;
  let page: Page;
  let db: DatabaseManager;

  let pageBlockId: BaseBlockModel['id'];
  let frameBlockId: BaseBlockModel['id'];
  let databaseBlockId: BaseBlockModel['id'];
  let p1: BaseBlockModel['id'];
  let p2: BaseBlockModel['id'];
  let col1: Column['id'];
  let col2: Column['id'];
  let col3: Column['id'];

  const selection = [
    { value: 'Done', color: '#F5F5F5' },
    { value: 'TODO', color: '#FFE1E1' },
    { value: 'WIP', color: '#E1EFFF' },
  ];

  beforeEach(() => {
    const options = createTestOptions();
    workspace = new Workspace(options).register(AffineSchemas);
    page = workspace.createPage('page0');
    page.awarenessStore.setFlag('enable_database', true);
    db = page.db;

    pageBlockId = page.addBlock('affine:page', {
      title: new page.Text('database test'),
    });
    frameBlockId = page.addBlock('affine:frame', {}, pageBlockId);

    col1 = page.db.updateColumn({
      name: 'Number',
      type: 'number',
      width: 200,
      hide: false,
      decimal: 0,
    });
    col2 = page.db.updateColumn({
      name: 'Single Select',
      type: 'select',
      width: 200,
      hide: false,
      selection,
    });
    col3 = page.db.updateColumn({
      name: 'Rich Text',
      type: 'rich-text',
      width: 200,
      hide: false,
    });

    databaseBlockId = page.addBlock(
      'affine:database',
      {
        columns: [col1, col2, col3],
        titleColumn: 'Title',
      },
      frameBlockId
    );
    p1 = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('text1'),
      },
      databaseBlockId
    );
    p2 = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('text2'),
      },
      databaseBlockId
    );

    page.db.updateCell(p1, {
      columnId: col1,
      value: 0.1,
    });
    page.db.updateCell(p2, {
      columnId: col2,
      value: [selection[1]],
    });
  });

  test('getColumn', () => {
    const column: Column = {
      id: 'testColumnId',
      name: 'Test Column',
      type: 'number',
      width: 100,
      hide: false,
    };
    db.updateColumn(column);

    const result = db.getColumn(column.id);
    expect(result).toEqual(column);
  });

  test('updateColumn', () => {
    const column: Omit<Column, 'id'> & { id?: Column['id'] } = {
      name: 'Test Column',
      type: 'number',
      width: 100,
      hide: false,
    };

    const id = db.updateColumn(column);
    const result = db.getColumn(id);

    expect(result).toMatchObject(column);
    expect(result).toHaveProperty('id');
  });

  test('deleteColumn', () => {
    const columnId = 'testColumnId';
    const column: Column = {
      id: columnId,
      name: 'Test Column',
      type: 'number',
      width: 100,
      hide: false,
    };

    db.updateColumn(column);
    expect(db.getColumn(columnId)).toEqual(column);

    db.deleteColumn(columnId);
    expect(db.getColumn(columnId)).toBeNull();
  });

  test('getCell', () => {
    const modelId = page.addBlock('affine:paragraph', {
      text: new page.Text('paragraph'),
    });
    const schema: Column = {
      id: 'testColumnId',
      name: 'Test Column',
      type: 'number',
      width: 100,
      hide: false,
    };
    const cell: Cell = {
      columnId: schema.id,
      value: 42,
    };

    page.db.updateColumn(schema);
    page.db.updateCell(modelId, cell);

    const model = page.getBlockById(modelId);

    expect(model).not.toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = db.getCell(model!.id, schema.id);
    expect(result).toEqual(cell);
  });

  test('updateCell', () => {
    const newRowId = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('text3'),
      },
      'databaseId'
    );

    page.db.updateCell(newRowId, {
      columnId: col2,
      value: [selection[2]],
    });

    const cell = page.db.getCell(newRowId, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [selection[2]],
    });
  });

  test('copyCellsByColumn', () => {
    const newColId = page.db.updateColumn({
      name: 'Copied Select',
      type: 'select',
      width: 200,
      hide: false,
      selection,
    });

    page.db.copyCellsByColumn(col2, newColId);

    const cell = page.db.getCell(p2, newColId);
    expect(cell).toEqual({
      columnId: newColId,
      value: [selection[1]],
    });
  });

  test('deleteCellsByColumn', () => {
    page.db.deleteCellsByColumn(col2);

    const cell = page.db.getCell(p2, { id: col2 } as Column);
    expect(cell).toBeNull();
  });

  // FIXME: https://github.com/toeverything/blocksuite/issues/1949
  test.skip('convertCellsByColumn', () => {
    page.db.convertCellsByColumn(col1, 'select');
    const cell = page.db.getCell(p1, { id: col1 } as Column);
    expect(cell).toEqual({
      columnId: col1,
      value: ['0.1'],
    });

    page.db.convertCellsByColumn(col1, 'rich-text');
    const richTextCell = page.db.getCell(p1, { id: col1 } as Column);
    expect(richTextCell?.value.toString()).toEqual('0.1');
  });

  test('renameSelectedCellTag', () => {
    const newSelection: SelectTag = {
      color: '#fff',
      value: 'Option 3',
    };
    page.db.renameSelectedCellTag(col2, selection[1], newSelection);

    const cell = page.db.getCell(p2, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [newSelection],
    });
  });

  test('deleteSelectedCellTag', () => {
    page.db.deleteSelectedCellTag(col2, selection[1]);

    const cell = page.db.getCell(p2, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [],
    });
  });
});
