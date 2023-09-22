import type { ReferenceElement } from '@floating-ui/dom';
import { html } from 'lit';

import type { Menu } from '../../../components/menu/index.js';
import { popMenu } from '../../../components/menu/index.js';
import { DeleteIcon } from '../../../icons/index.js';
import { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { DataViewTableManager } from '../../table/table-view-manager.js';
import { groupByMatcher } from './matcher.js';

export const popSelectGroupByProperty = (
  target: ReferenceElement,
  view: DataViewTableManager | DataViewKanbanManager
) => {
  popMenu(target, {
    options: {
      input: {
        search: true,
        placeholder: 'Search',
      },
      items: [
        ...view.columnsWithoutFilter
          .filter(id => {
            if (view.columnGet(id).type === 'title') {
              return false;
            }
            return !!groupByMatcher.match(view.columnGet(id).dataType);
          })
          .map<Menu>(id => {
            const column = view.columnGet(id);
            return {
              type: 'action',
              name: column.name,
              isSelected: view.view.groupBy?.columnId === id,
              icon: html` <uni-lit .uni="${column.icon}"></uni-lit>`,
              select: () => {
                view.changeGroup(id);
              },
            };
          }),
        {
          type: 'group',
          name: '',
          hide: () =>
            view instanceof DataViewKanbanManager || view.view.groupBy == null,
          children: () => [
            {
              type: 'action',
              icon: DeleteIcon,
              class: 'delete-item',
              name: 'Remove Grouping',
              select: () => {
                if (view instanceof DataViewTableManager) {
                  view.changeGroup(undefined);
                }
              },
            },
          ],
        },
      ],
    },
  });
};
export const popGroupSetting = (
  target: ReferenceElement,
  view: DataViewTableManager | DataViewKanbanManager
) => {
  view;
  popMenu(target, {
    options: {
      input: {
        search: true,
      },
      items: [],
    },
  });
};
