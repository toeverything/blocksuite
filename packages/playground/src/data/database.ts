import { type SelectTag } from '@blocksuite/blocks';
import {
  numberHelper,
  richTextHelper,
  selectHelper,
} from '@blocksuite/blocks/database-block/common/column-manager';
import type { DatabaseBlockModel } from '@blocksuite/blocks/models';
import { nanoid, Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const database: InitFn = (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  page.awarenessStore.setFlag('enable_database', true);
  page.awarenessStore.setFlag('enable_database_filter', true);

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
  const col1 = database.updateColumn(numberHelper.create('Number'));
  const col2 = database.updateColumn(
    selectHelper.create('Single Select', { options: selection })
  );
  const col3 = database.updateColumn(richTextHelper.create('Rich Text'));

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

  database.updateCell(p1, {
    columnId: col1,
    value: 0.1,
  });

  database.updateCell(p2, {
    columnId: col2,
    value: selection[1].id,
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
  database.addView('table');
  page.resetHistory();
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
