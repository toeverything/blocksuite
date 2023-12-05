import type { ListType, ParagraphType } from '@blocksuite/blocks';
import { getServiceOrRegister } from '@blocksuite/blocks';
import { checkboxPureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/checkbox/define';
import { datePureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/date/define';
import { linkPureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/link/define';
import { multiSelectColumnConfig } from '@blocksuite/blocks/database-block/common/columns/multi-select/cell-renderer';
import { numberPureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/number/define';
import { progressPureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/progress/define';
import { richTextPureColumnConfig } from '@blocksuite/blocks/database-block/common/columns/rich-text/define';
import type { DatabaseBlockModel } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import { Text, type Workspace } from '@blocksuite/store';

import { type InitFn } from './utils';

export const database: InitFn = async (workspace: Workspace, id: string) => {
  const page = workspace.createPage({ id });
  page.awarenessStore.setFlag('enable_expand_database_block', true);

  await page.load(async () => {
    // Add page block and surface block at root level
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text('BlockSuite Playground'),
    });
    page.addBlock('affine:surface', {}, pageBlockId);

    // Add note block inside page block
    const noteId = page.addBlock('affine:note', {}, pageBlockId);
    const pId = page.addBlock('affine:paragraph', {}, noteId);
    const model = page.getBlockById(pId);
    assertExists(model);
    // Add database block inside note block
    const databaseId = page.addBlock(
      'affine:database',
      {
        columns: [],
        cells: {},
      },
      noteId
    );
    const service = await getServiceOrRegister('affine:database');
    service.initDatabaseBlock(page, model, databaseId, 'table', true);
    const database = page.getBlockById(databaseId) as DatabaseBlockModel;
    database.addColumn(
      'end',
      numberPureColumnConfig.create(numberPureColumnConfig.name)
    );
    database.addColumn(
      'end',
      richTextPureColumnConfig.create(richTextPureColumnConfig.name)
    );
    database.addColumn(
      'end',
      datePureColumnConfig.create(datePureColumnConfig.name)
    );
    database.addColumn(
      'end',
      linkPureColumnConfig.create(linkPureColumnConfig.name)
    );
    database.addColumn(
      'end',
      progressPureColumnConfig.create(progressPureColumnConfig.name)
    );
    database.addColumn(
      'end',
      checkboxPureColumnConfig.create(checkboxPureColumnConfig.name)
    );
    database.addColumn(
      'end',
      multiSelectColumnConfig.create(multiSelectColumnConfig.name)
    );
    database.updateView(database.views[0].id, () => {
      return {
        groupBy: {
          columnId: database.columns[1].id,
          type: 'groupBy',
          name: 'select',
        },
      };
    });
    const paragraphTypes: ParagraphType[] = [
      'text',
      'quote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ];
    paragraphTypes.forEach(type => {
      page.addBlock(
        'affine:paragraph',
        { type: type, text: new Text(`Paragraph type ${type}`) },
        databaseId
      );
    });
    const listTypes: ListType[] = ['numbered', 'bulleted', 'todo', 'toggle'];

    listTypes.forEach(type => {
      page.addBlock(
        'affine:list',
        { type: type, text: new Text(`List type ${type}`) },
        databaseId
      );
    });
    // Add a paragraph after database
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);
    page.addBlock('affine:paragraph', {}, noteId);
    database.addView('kanban');
  });

  page.resetHistory();
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
