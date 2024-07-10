import {
  columnPresets,
  type DatabaseBlockModel,
  databaseViewAddView,
  type ListType,
  type ParagraphType,
  richTextColumnConfig,
  viewPresets,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { type DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

export const database: InitFn = (collection: DocCollection, id: string) => {
  const doc = collection.createDoc({ id });
  doc.awarenessStore.setFlag('enable_expand_database_block', true);
  doc.awarenessStore.setFlag('enable_database_statistics', true);
  doc.awarenessStore.setFlag('enable_database_attachment_note', true);
  doc.awarenessStore.setFlag('enable_block_query', true);

  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = doc.addBlock('affine:page', {
      title: new Text('BlockSuite Playground'),
    });
    doc.addBlock('affine:surface', {}, rootId);

    // Add note block inside root block
    const noteId = doc.addBlock('affine:note', {}, rootId);
    const pId = doc.addBlock('affine:paragraph', {}, noteId);
    const model = doc.getBlockById(pId);
    assertExists(model);
    // Add database block inside note block
    const databaseId = doc.addBlock(
      'affine:database',
      {
        columns: [],
        cells: {},
      },
      noteId
    );

    new Promise(resolve => requestAnimationFrame(resolve))
      .then(() => {
        const service = window.host.std.spec.getService('affine:database');
        service.initDatabaseBlock(
          doc,
          model,
          databaseId,
          viewPresets.tableViewConfig,
          true
        );
        const database = doc.getBlockById(databaseId) as DatabaseBlockModel;
        const richTextId = database.addColumn(
          'end',
          richTextColumnConfig.model.create(richTextColumnConfig.model.name)
        );
        Object.values([
          columnPresets.multiSelectColumnConfig,
          columnPresets.dateColumnConfig,
          columnPresets.numberColumnConfig,
          columnPresets.linkColumnConfig,
          columnPresets.checkboxColumnConfig,
          columnPresets.progressColumnConfig,
        ]).forEach(column => {
          database.addColumn('end', column.model.create(column.model.name));
        });
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
          const id = doc.addBlock(
            'affine:paragraph',
            { type: type, text: new Text(`Paragraph type ${type}`) },
            databaseId
          );
          database.updateCell(id, {
            columnId: richTextId,
            value: new Text(`Paragraph type ${type}`),
          });
        });
        const listTypes: ListType[] = [
          'numbered',
          'bulleted',
          'todo',
          'toggle',
        ];

        listTypes.forEach(type => {
          const id = doc.addBlock(
            'affine:list',
            { type: type, text: new Text(`List type ${type}`) },
            databaseId
          );
          database.updateCell(id, {
            columnId: richTextId,
            value: new Text(`List type ${type}`),
          });
        });
        // Add a paragraph after database
        doc.addBlock('affine:paragraph', {}, noteId);
        doc.addBlock('affine:paragraph', {}, noteId);
        doc.addBlock('affine:paragraph', {}, noteId);
        doc.addBlock('affine:paragraph', {}, noteId);
        doc.addBlock('affine:paragraph', {}, noteId);
        databaseViewAddView(database, viewPresets.kanbanViewConfig);

        doc.resetHistory();
      })
      .catch(console.error);
  });
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
