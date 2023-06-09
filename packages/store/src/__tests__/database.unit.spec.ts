/* eslint-disable @typescript-eslint/no-restricted-imports */
import { beforeEach, describe, expect, test } from 'vitest';

import {
  numberHelper,
  richTextHelper,
  selectHelper,
} from '../../../blocks/src/database-block/common/column-manager';
import type { DatabaseBlockModel } from '../../../blocks/src/database-block/database-model.js';
import { DatabaseBlockSchema } from '../../../blocks/src/database-block/database-model.js';
import type { Cell, Column } from '../../../blocks/src/database-block/types.js';
import { FrameBlockSchema } from '../../../blocks/src/frame-block/frame-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import type { BaseBlockModel, Page } from '../index.js';
import { Generator, Workspace } from '../index.js';

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  return { id: 'test-workspace', idGenerator, isSSR: true };
}

const AffineSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  FrameBlockSchema,
  DatabaseBlockSchema,
];

describe('DatabaseManager', () => {
  let workspace: Workspace;
  let page: Page;
  let db: DatabaseBlockModel;

  let pageBlockId: BaseBlockModel['id'];
  let frameBlockId: BaseBlockModel['id'];
  let databaseBlockId: BaseBlockModel['id'];
  let p1: BaseBlockModel['id'];
  let p2: BaseBlockModel['id'];
  let col1: Column['id'];
  let col2: Column['id'];
  let col3: Column['id'];

  const selection = [
    { id: '1', value: 'Done', color: 'var(--affine-tag-white)' },
    { id: '2', value: 'TODO', color: 'var(--affine-tag-pink)' },
    { id: '3', value: 'WIP', color: 'var(--affine-tag-blue)' },
  ];

  beforeEach(() => {
    const options = createTestOptions();
    workspace = new Workspace(options).register(AffineSchemas);
    page = workspace.createPage({ id: 'page0' });
    page.awarenessStore.setFlag('enable_database', true);

    pageBlockId = page.addBlock('affine:page', {
      title: new page.Text('database test'),
    });
    frameBlockId = page.addBlock('affine:frame', {}, pageBlockId);

    databaseBlockId = page.addBlock(
      'affine:database',
      {
        columns: [],
        titleColumn: 'Title',
      },
      frameBlockId
    );

    const databaseModel = page.getBlockById(
      databaseBlockId
    ) as DatabaseBlockModel;
    db = databaseModel;

    col1 = db.updateColumn(numberHelper.create('Number'));
    col2 = db.updateColumn(
      selectHelper.create('Single Select', {
        options: selection,
      })
    );
    col3 = db.updateColumn(richTextHelper.create('Rich Text'));

    page.updateBlock(databaseModel, {
      columns: [col1, col2, col3],
    });

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

    db.updateCell(p1, {
      columnId: col1,
      value: 0.1,
    });
    db.updateCell(p2, {
      columnId: col2,
      value: [selection[1]],
    });
  });

  test('getColumn', () => {
    const column = numberHelper.create('testColumnId');
    column.id = 'testColumnId';
    db.updateColumn(column);

    const result = db.getColumn(column.id);
    expect(result).toEqual(column);
  });

  test('updateColumn', () => {
    const column = numberHelper.create('Test Column');
    const id = db.updateColumn(column);
    const result = db.getColumn(id);

    expect(result).toMatchObject(column);
    expect(result).toHaveProperty('id');
  });

  test('deleteColumn', () => {
    const column = numberHelper.create('Test Column');
    const columnId = 'testColumnId';
    column.id = columnId;

    db.updateColumn(column);
    expect(db.getColumn(columnId)).toEqual(column);

    db.deleteColumn(columnId);
    expect(db.getColumn(columnId)).toBeNull();
  });

  test('getCell', () => {
    const modelId = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('paragraph'),
      },
      frameBlockId
    );
    const column = numberHelper.create('Test Column');
    column.id = 'testColumnId';
    const cell: Cell = {
      columnId: column.id,
      value: 42,
    };

    db.updateColumn(column);
    db.updateCell(modelId, cell);

    const model = page.getBlockById(modelId);

    expect(model).not.toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = db.getCell(model!.id, column.id);
    expect(result).toEqual(cell);
  });

  test('updateCell', () => {
    const newRowId = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('text3'),
      },
      databaseBlockId
    );

    db.updateCell(newRowId, {
      columnId: col2,
      value: [selection[2]],
    });

    const cell = db.getCell(newRowId, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [selection[2]],
    });
  });

  test('copyCellsByColumn', () => {
    const newColId = db.updateColumn(
      selectHelper.create('Copied Select', { options: selection })
    );

    db.copyCellsByColumn(col2, newColId);

    const cell = db.getCell(p2, newColId);
    expect(cell).toEqual({
      columnId: newColId,
      value: [selection[1]],
    });
  });

  test('deleteCellsByColumn', () => {
    db.deleteCellsByColumn(col2);

    const cell = db.getCell(p2, col2);
    expect(cell).toBeNull();
  });

  // FIXME: https://github.com/toeverything/blocksuite/issues/1949
  test.skip('convertCellsByColumn', () => {
    db.convertCellsByColumn(col1, 'select');
    const cell = db.getCell(p1, col1);
    expect(cell).toEqual({
      columnId: col1,
      value: ['0.1'],
    });

    db.convertCellsByColumn(col1, 'rich-text');
    const richTextCell = db.getCell(p1, col1);
    expect(richTextCell?.value.toString()).toEqual('0.1');
  });

  test('deleteSelectedCellTag', () => {
    db.deleteSelectedCellTag(col2, selection[1]);

    const cell = db.getCell(p2, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [],
    });
  });
});
