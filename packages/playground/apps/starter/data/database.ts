import {
  databaseBlockColumns,
  type DatabaseBlockModel,
  type ListType,
  type ParagraphType,
  type ViewBasicDataType,
} from '@blocksuite/blocks';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import { assertExists } from '@blocksuite/global/utils';
import { type DocCollection, Text } from '@blocksuite/store';

import type { InitFn } from './utils.js';

import { propertyPresets } from '../../../../affine/data-view/src/property-presets';

export const database: InitFn = (collection: DocCollection, id: string) => {
  const doc = collection.createDoc({ id });
  doc.awarenessStore.setFlag('enable_database_number_formatting', true);
  doc.awarenessStore.setFlag('enable_database_attachment_note', true);
  doc.awarenessStore.setFlag('enable_database_full_width', true);
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
    const addDatabase = (title: string, group = true) => {
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
          const service = window.host.std.getService('affine:database');
          if (!service) return;
          service.initDatabaseBlock(
            doc,
            model,
            databaseId,
            viewPresets.tableViewMeta.type,
            true
          );
          const database = doc.getBlockById(databaseId) as DatabaseBlockModel;
          database.title = new Text(title);
          const richTextId = service.addColumn(
            database,
            'end',
            databaseBlockColumns.richTextColumnConfig.create(
              databaseBlockColumns.richTextColumnConfig.config.name
            )
          );
          Object.values([
            propertyPresets.multiSelectPropertyConfig,
            propertyPresets.datePropertyConfig,
            propertyPresets.numberPropertyConfig,
            databaseBlockColumns.linkColumnConfig,
            propertyPresets.checkboxPropertyConfig,
            propertyPresets.progressPropertyConfig,
          ]).forEach(column => {
            service.addColumn(
              database,
              'end',
              column.create(column.config.name)
            );
          });
          service.updateView(database, database.views[0].id, () => {
            return {
              groupBy: group
                ? {
                    columnId: database.columns[1].id,
                    type: 'groupBy',
                    name: 'select',
                  }
                : undefined,
            } as Partial<ViewBasicDataType>;
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
            service.updateCell(database, id, {
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
            service.updateCell(database, id, {
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
          service.databaseViewAddView(
            database,
            viewPresets.kanbanViewMeta.type
          );

          doc.resetHistory();
        })
        .catch(console.error);
    };
    // Add database block inside note block
    addDatabase('Database 1', false);
    addDatabase('Database 2');
    addDatabase('Database 3');
    addDatabase('Database 4');
    addDatabase('Database 5');
    addDatabase('Database 6');
    addDatabase('Database 7');
    addDatabase('Database 8');
    addDatabase('Database 9');
    addDatabase('Database 10');
  });
};

database.id = 'database';
database.displayName = 'Database Example';
database.description = 'Database block basic example';
