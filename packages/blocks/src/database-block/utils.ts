import { nanoid } from '@blocksuite/store';

import type {
  ColumnMeta,
  DataViewDataType,
  ViewMeta,
} from './data-view/index.js';
import type { DataViewTypes } from './data-view/view/data-view.js';
import type { Column } from './data-view/view/presets/table/types.js';
import type { DatabaseBlockModel } from './database-model.js';

import { databaseBlockAllColumnMap } from './columns/index.js';
import { titlePureColumnConfig } from './columns/title/define.js';
import { multiSelectColumnModelConfig } from './data-view/column/presets/multi-select/define.js';
import { numberColumnModelConfig } from './data-view/column/presets/number/define.js';
import { selectColumnModelConfig } from './data-view/column/presets/select/define.js';
import { textColumnModelConfig } from './data-view/column/presets/text/define.js';
import { groupByMatcher } from './data-view/common/group-by/matcher.js';
import { defaultGroupBy } from './data-view/common/view-manager.js';
import { columnPresets } from './data-view/index.js';
import { getTagColor } from './data-view/utils/tags/colors.js';

const initMap: Record<
  DataViewTypes,
  (
    columnMetaMap: Record<string, ColumnMeta>,
    model: DatabaseBlockModel,
    id: string,
    name: string
  ) => DataViewDataType
> = {
  kanban(columnMetaMap, model, id, name) {
    const allowList = model.columns.filter(column => {
      const type = columnMetaMap[column.type].model.dataType(column.data);
      return !!groupByMatcher.match(type) && column.type !== 'title';
    });
    const getWeight = (column: Column) => {
      if (
        [
          multiSelectColumnModelConfig.type,
          selectColumnModelConfig.type as string,
        ].includes(column.type)
      ) {
        return 3;
      }
      if (
        [
          numberColumnModelConfig.type as string,
          textColumnModelConfig.type,
        ].includes(column.type)
      ) {
        return 2;
      }
      return 1;
    };
    const column = allowList.sort((a, b) => getWeight(b) - getWeight(a))[0];
    if (!column) {
      throw new Error('not implement yet');
    }
    return {
      columns: model.columns.map(v => ({
        hide: false,
        id: v.id,
      })),
      filter: {
        conditions: [],
        op: 'and',
        type: 'group',
      },
      groupBy: defaultGroupBy(
        columnMetaMap[column.type],
        column.id,
        column.data
      ),
      groupProperties: [],
      header: {
        iconColumn: 'type',
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
      },
      id,
      mode: 'kanban',
      name,
    };
  },
  table(_columnMetaMap, model, id, name) {
    return {
      columns: [],
      filter: {
        conditions: [],
        op: 'and',
        type: 'group',
      },
      header: {
        iconColumn: 'type',
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
      },
      id,
      mode: 'table',
      name,
    };
  },
};
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
          color: getTagColor(),
          id: ids[0],
          value: 'TODO',
        },
        {
          color: getTagColor(),
          id: ids[1],
          value: 'In Progress',
        },
        {
          color: getTagColor(),
          id: ids[2],
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
  const view = initMap[viewMeta.type](
    databaseBlockAllColumnMap,
    model,
    id,
    viewMeta.model.defaultName
  );
  model.doc.transact(() => {
    model.views.push(view);
  });
  return view;
};
