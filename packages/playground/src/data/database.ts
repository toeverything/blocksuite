import type { SelectTag } from '@blocksuite/blocks/components/tags/multi-tag-select';
import {
  numberHelper,
  richTextHelper,
  selectHelper,
} from '@blocksuite/blocks/database-block/common/columns/define';
import type { DatabaseBlockModel } from '@blocksuite/blocks/models';
import { nanoid, Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const database: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  await page.waitForLoaded();
  page.awarenessStore.setFlag('enable_database', true);
  page.awarenessStore.setFlag('enable_database_filter', true);
  page.awarenessStore.setFlag('enable_data_view', true);
  // Add page block and surface block at root level
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Welcome to BlockSuite Playground'),
  });
  page.addBlock('affine:surface', {}, pageBlockId);

  // Add note block inside page block
  const noteId = page.addBlock('affine:note', {}, pageBlockId);

  const selection: SelectTag[] = [
    { id: nanoid(), value: 'Done', color: 'var(--affine-tag-white)' },
    { id: nanoid(), value: 'TODO', color: 'var(--affine-tag-pink)' },
    { id: nanoid(), value: 'WIP', color: 'var(--affine-tag-blue)' },
  ];
  // Add database block inside note block
  const databaseId = page.addBlock(
    'affine:database',
    {
      columns: [],
      cells: {},
      titleColumnName: 'Title',
      titleColumnWidth: 200,
    },
    noteId
  );
  const database = page.getBlockById(databaseId) as DatabaseBlockModel;
  const col1 = database.addColumn('end', numberHelper.create('Number'));
  const col2 = database.addColumn(
    'end',
    selectHelper.create('Single Select', { options: selection })
  );
  const col3 = database.addColumn('end', richTextHelper.create('Rich Text'));

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
  page.addBlock('affine:paragraph', {}, noteId);
  database.addView('table');
  page.resetHistory();
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
