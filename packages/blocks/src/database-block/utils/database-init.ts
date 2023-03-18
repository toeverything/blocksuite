import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

export function initDatabaseBlock(
  page: Page,
  model: BaseBlockModel,
  databaseId: string
) {
  // By default, database has 3 empty rows
  for (let i = 0; i < 3; i++) {
    page.addBlockByFlavour(
      'affine:paragraph',
      {
        text: new page.Text(''),
      },
      databaseId
    );
  }
  // Add a paragraph after database
  const parent = page.getParent(model);
  assertExists(parent);
  page.addBlockByFlavour('affine:paragraph', {}, parent.id);

  // default column
  const tagColumnId = page.setColumnSchema({
    internalProperty: {
      color: '#ff0000',
      width: 200,
      hide: false,
    },
    property: {},
    name: 'Tag',
    type: 'select',
  });
  const blockModel = page.getBlockById(databaseId);
  assertExists(blockModel);
  page.updateBlock(blockModel, {
    columns: [tagColumnId],
  });
}
