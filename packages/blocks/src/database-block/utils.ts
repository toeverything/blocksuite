import { nanoid } from '@blocksuite/store';

import { databaseBlockColumnMap } from './columns/index.js';
import { titlePureColumnConfig } from './columns/title/define.js';
import type { ViewMeta } from './data-view/index.js';
import { columnPresets } from './data-view/index.js';
import { getTagColor } from './data-view/utils/tags/colors.js';
import type { DatabaseBlockModel } from './database-model.js';

export const databaseViewInitEmpty = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  model.addColumn(
    'start',
    titlePureColumnConfig.create(titlePureColumnConfig.model.name)
  );
  databaseViewAddView(model, viewMeta);
};

export const databaseViewInitConvert = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  model.addColumn(
    'end',
    columnPresets.multiSelectColumnConfig.model.create('Tag', { options: [] })
  );
  databaseViewInitEmpty(model, viewMeta);
};

export const databaseViewInitTemplate = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const ids = [nanoid(), nanoid(), nanoid()];
  const statusId = model.addColumn(
    'end',
    columnPresets.selectColumnConfig.model.create('Status', {
      options: [
        {
          id: ids[0],
          color: getTagColor(),
          value: 'TODO',
        },
        {
          id: ids[1],
          color: getTagColor(),
          value: 'In Progress',
        },
        {
          id: ids[2],
          color: getTagColor(),
          value: 'Done',
        },
      ],
    })
  );
  for (let i = 0; i < 4; i++) {
    const rowId = model.doc.addBlock(
      'affine:paragraph',
      {
        text: new model.doc.Text(`Task ${i + 1}`),
      },
      model.id
    );
    model.updateCell(rowId, {
      columnId: statusId,
      value: ids[i],
    });
  }
  databaseViewInitEmpty(model, viewMeta);
};

export const databaseViewAddView = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const id = model.doc.generateBlockId();
  const view = viewMeta.model.init(
    databaseBlockColumnMap,
    model,
    id,
    viewMeta.model.defaultName
  );
  model.doc.transact(() => {
    model.views.push(view);
  });
  return view;
};
