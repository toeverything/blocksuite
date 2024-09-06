import type { BlockModel, Doc } from '@blocksuite/store';

import {
  type Cell,
  type Column,
  type DatabaseBlockModel,
  DatabaseBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
} from '@blocksuite/affine-model';
import { columnModelPresets } from '@blocksuite/data-view/column-pure-presets';
import { DocCollection, IdGeneratorType, Schema } from '@blocksuite/store';
import { beforeEach, describe, expect, test } from 'vitest';

import { databaseBlockColumns } from '../../database-block/index.js';
import {
  addColumn,
  copyCellsByColumn,
  deleteColumn,
  getCell,
  getColumn,
  updateCell,
} from '../../database-block/utils.js';

const AffineSchemas = [
  RootBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  DatabaseBlockSchema,
];

function createTestOptions() {
  const idGenerator = IdGeneratorType.AutoIncrement;
  const schema = new Schema();
  schema.register(AffineSchemas);
  return { id: 'test-collection', idGenerator, schema };
}

function createTestDoc(docId = 'doc0') {
  const options = createTestOptions();
  const collection = new DocCollection(options);
  collection.meta.initialize();
  const doc = collection.createDoc({ id: docId });
  doc.load();
  return doc;
}

describe('DatabaseManager', () => {
  let doc: Doc;
  let db: DatabaseBlockModel;

  let rootId: BlockModel['id'];
  let noteBlockId: BlockModel['id'];
  let databaseBlockId: BlockModel['id'];
  let p1: BlockModel['id'];
  let p2: BlockModel['id'];
  let col1: Column['id'];
  let col2: Column['id'];
  let col3: Column['id'];

  const selection = [
    { id: '1', value: 'Done', color: 'var(--affine-tag-white)' },
    { id: '2', value: 'TODO', color: 'var(--affine-tag-pink)' },
    { id: '3', value: 'WIP', color: 'var(--affine-tag-blue)' },
  ];

  beforeEach(() => {
    doc = createTestDoc();

    rootId = doc.addBlock('affine:page', {
      title: new doc.Text('database test'),
    });
    noteBlockId = doc.addBlock('affine:note', {}, rootId);

    databaseBlockId = doc.addBlock(
      'affine:database' as BlockSuite.Flavour,
      {
        columns: [],
        titleColumn: 'Title',
      },
      noteBlockId
    );

    const databaseModel = doc.getBlockById(
      databaseBlockId
    ) as DatabaseBlockModel;
    db = databaseModel;

    col1 = addColumn(
      db,
      'end',
      databaseBlockColumns.numberColumnConfig.create('Number')
    );
    col2 = addColumn(
      db,
      'end',
      columnModelPresets.selectColumnModelConfig.create('Single Select', {
        options: selection,
      })
    );
    col3 = addColumn(
      db,
      'end',
      databaseBlockColumns.richTextColumnConfig.create('Rich Text')
    );

    doc.updateBlock(databaseModel, {
      columns: [col1, col2, col3],
    });

    p1 = doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text('text1'),
      },
      databaseBlockId
    );
    p2 = doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text('text2'),
      },
      databaseBlockId
    );

    updateCell(db, p1, {
      columnId: col1,
      value: 0.1,
    });
    updateCell(db, p2, {
      columnId: col2,
      value: [selection[1]],
    });
  });

  test('getColumn', () => {
    const column = {
      ...databaseBlockColumns.numberColumnConfig.create('testColumnId'),
      id: 'testColumnId',
    };
    addColumn(db, 'end', column);

    const result = getColumn(db, column.id);
    expect(result).toEqual(column);
  });

  test('addColumn', () => {
    const column =
      databaseBlockColumns.numberColumnConfig.create('Test Column');
    const id = addColumn(db, 'end', column);
    const result = getColumn(db, id);

    expect(result).toMatchObject(column);
    expect(result).toHaveProperty('id');
  });

  test('deleteColumn', () => {
    const column = {
      ...databaseBlockColumns.numberColumnConfig.create('Test Column'),
      id: 'testColumnId',
    };
    addColumn(db, 'end', column);
    expect(getColumn(db, column.id)).toEqual(column);

    deleteColumn(db, column.id);
    expect(getColumn(db, column.id)).toBeUndefined();
  });

  test('getCell', () => {
    const modelId = doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text('paragraph'),
      },
      noteBlockId
    );
    const column = {
      ...databaseBlockColumns.numberColumnConfig.create('Test Column'),
      id: 'testColumnId',
    };
    const cell: Cell = {
      columnId: column.id,
      value: 42,
    };

    addColumn(db, 'end', column);
    updateCell(db, modelId, cell);

    const model = doc.getBlockById(modelId);

    expect(model).not.toBeNull();

    const result = getCell(db, model!.id, column.id);
    expect(result).toEqual(cell);
  });

  test('updateCell', () => {
    const newRowId = doc.addBlock(
      'affine:paragraph',
      {
        text: new doc.Text('text3'),
      },
      databaseBlockId
    );

    updateCell(db, newRowId, {
      columnId: col2,
      value: [selection[2]],
    });

    const cell = getCell(db, newRowId, col2);
    expect(cell).toEqual({
      columnId: col2,
      value: [selection[2]],
    });
  });

  test('copyCellsByColumn', () => {
    const newColId = addColumn(
      db,
      'end',
      columnModelPresets.selectColumnModelConfig.create('Copied Select', {
        options: selection,
      })
    );

    copyCellsByColumn(db, col2, newColId);

    const cell = getCell(db, p2, newColId);
    expect(cell).toEqual({
      columnId: newColId,
      value: [selection[1]],
    });
  });
});
