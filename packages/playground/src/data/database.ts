import { type SelectTag } from '@blocksuite/blocks';
import type { DatabaseBlockModel } from '@blocksuite/blocks/models';
import { nanoid, Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const database: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  page.awarenessStore.setFlag('enable_database', true);

  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Welcome to BlockSuite Playground'),
  });
  page.addBlock('affine:surface', {}, pageBlockId);

  // Add frame block inside page block
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);

  const selection: SelectTag[] = [
    { id: nanoid(), value: 'Done', color: 'var(--affine-tag-white)' },
    { id: nanoid(), value: 'TODO', color: 'var(--affine-tag-pink)' },
    { id: nanoid(), value: 'WIP', color: 'var(--affine-tag-blue)' },
  ];
  // Add database block inside frame block
  const databaseId = page.addBlock(
    'affine:database',
    {
      columns: [],
      cells: {},
      titleColumnName: 'Title',
      titleColumnWidth: 200,
    },
    frameId
  );
  const database = page.getBlockById(databaseId) as DatabaseBlockModel;
  const col1 = database.updateColumn({
    name: 'Number',
    type: 'number',
    width: 200,
    hide: false,
    decimal: 0,
  });
  const col2 = database.updateColumn({
    name: 'Single Select',
    type: 'select',
    width: 200,
    hide: false,
    selection,
  });
  const col3 = database.updateColumn({
    name: 'Rich Text',
    type: 'rich-text',
    width: 200,
    hide: false,
  });

  database.applyColumnUpdate();

  const p1 = page.addBlock(
    'affine:paragraph',
    {
      text: new page.Text('text1'),
    },
    databaseId
  );
  const p2 = page.addBlock(
    'affine:paragraph',
    {
      text: new page.Text('text2'),
    },
    databaseId
  );

  const num = new page.YText();
  num.insert(0, '0.1');
  database.updateCell(p1, {
    columnId: col1,
    value: num,
  });

  database.updateCell(p2, {
    columnId: col2,
    value: [selection[1]],
  });

  const text = new page.YText();
  text.insert(0, '123');
  text.insert(0, 'code');
  database.updateCell(p2, {
    columnId: col3,
    value: text,
  });

  // Add a paragraph after database
  page.addBlock('affine:paragraph', {}, frameId);
  page.resetHistory();
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
