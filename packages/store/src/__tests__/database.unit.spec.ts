/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../../../blocks/src/database-block/kanban/define';
import '../../../blocks/src/database-block/table/define';

import { beforeEach, describe, expect, test } from 'vitest';

import { numberPureColumnConfig } from '../../../blocks/src/database-block/common/columns/number/define';
import { richTextPureColumnConfig } from '../../../blocks/src/database-block/common/columns/rich-text/define';
import { selectPureColumnConfig } from '../../../blocks/src/database-block/common/columns/select/define';
import type { DatabaseBlockModel } from '../../../blocks/src/database-block/database-model.js';
import { DatabaseBlockSchema } from '../../../blocks/src/database-block/database-model.js';
import type { Cell, Column } from '../../../blocks/src/database-block/types.js';
import { NoteBlockSchema } from '../../../blocks/src/note-block/note-model.js';
import { PageBlockSchema } from '../../../blocks/src/page-block/page-model.js';
import { ParagraphBlockSchema } from '../../../blocks/src/paragraph-block/paragraph-model.js';
import type { BaseBlockModel, Page } from '../index.js';
import { Generator, Schema, Workspace } from '../index.js';

const AffineSchemas = [
  ParagraphBlockSchema,
  PageBlockSchema,
  NoteBlockSchema,
  DatabaseBlockSchema,
];

function createTestOptions() {
  const idGenerator = Generator.AutoIncrement;
  const schema = new Schema();
  schema.register(AffineSchemas);
  return { id: 'test-workspace', idGenerator, schema };
}

async function createTestPage(pageId = 'page0') {
  const options = createTestOptions();
  const workspace = new Workspace(options);
  const page = workspace.createPage({ id: pageId });
  await page.load();
  return page;
}

describe('DatabaseManager', () => {
  let page: Page;
  let db: DatabaseBlockModel;

  let pageBlockId: BaseBlockModel['id'];
  let noteBlockId: BaseBlockModel['id'];
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

  beforeEach(async () => {
    page = await createTestPage();

    pageBlockId = page.addBlock('affine:page', {
      title: new page.Text('database test'),
    });
    noteBlockId = page.addBlock('affine:note', {}, pageBlockId);

    databaseBlockId = page.addBlock(
      'affine:database',
      {
        columns: [],
        titleColumn: 'Title',
      },
      noteBlockId
    );

    const databaseModel = page.getBlockById(
      databaseBlockId
    ) as DatabaseBlockModel;
    db = databaseModel;

    col1 = db.addColumn('end', numberPureColumnConfig.create('Number'));
    col2 = db.addColumn(
      'end',
      selectPureColumnConfig.create('Single Select', { options: selection })
    );
    col3 = db.addColumn('end', richTextPureColumnConfig.create('Rich Text'));

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
    const column = {
      ...numberPureColumnConfig.create('testColumnId'),
      id: 'testColumnId',
    };
    db.addColumn('end', column);

    const result = db.getColumn(column.id);
    expect(result).toEqual(column);
  });

  test('addColumn', () => {
    const column = numberPureColumnConfig.create('Test Column');
    const id = db.addColumn('end', column);
    const result = db.getColumn(id);

    expect(result).toMatchObject(column);
    expect(result).toHaveProperty('id');
  });

  test('deleteColumn', () => {
    const column = {
      ...numberPureColumnConfig.create('Test Column'),
      id: 'testColumnId',
    };
    db.addColumn('end', column);
    expect(db.getColumn(column.id)).toEqual(column);

    db.deleteColumn(column.id);
    expect(db.getColumn(column.id)).toBeUndefined();
  });

  test('getCell', () => {
    const modelId = page.addBlock(
      'affine:paragraph',
      {
        text: new page.Text('paragraph'),
      },
      noteBlockId
    );
    const column = {
      ...numberPureColumnConfig.create('Test Column'),
      id: 'testColumnId',
    };
    const cell: Cell = {
      columnId: column.id,
      value: 42,
    };

    db.addColumn('end', column);
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
    const newColId = db.addColumn(
      'end',
      selectPureColumnConfig.create('Copied Select', { options: selection })
    );

    db.copyCellsByColumn(col2, newColId);

    const cell = db.getCell(p2, newColId);
    expect(cell).toEqual({
      columnId: newColId,
      value: [selection[1]],
    });
  });
});
