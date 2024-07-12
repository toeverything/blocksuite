import { html } from 'lit/static-html.js';

import type { Menu, MenuOptions } from '../../../_common/components/index.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../view/data-view-manager.js';

export const inputConfig = (
  column: DataViewColumnManager
): MenuOptions['input'] => {
  return {
    divider: false,
    icon: html`
      <div class="affine-database-column-type-menu-icon">
        <uni-lit .uni="${column.icon}"></uni-lit>
      </div>
    `,
    initValue: column.name,
    onComplete: text => {
      column.updateName(text);
    },
  };
};
export const typeConfig = (
  column: DataViewColumnManager,
  viewManager: DataViewManager
): Menu => {
  return {
    children: () => [
      {
        hide: () => !column.updateType || column.type === 'title',
        name: 'Type',
        options: {
          input: {
            search: true,
          },
          items: viewManager.allColumnConfig.map(config => {
            return {
              icon: html` <uni-lit
                .uni="${viewManager.getIcon(config.type)}"
              ></uni-lit>`,
              isSelected: config.type === column.type,
              name: config.name,
              select: () => {
                if (column.type === config.type) {
                  return;
                }
                column.updateType?.(config.type);
              },
              type: 'action',
            };
          }),
        },
        postfix: html`<div
          class="affine-database-column-type-icon"
          style="color: var(--affine-text-secondary-color);gap:4px"
        >
          <uni-lit .uni="${column.icon}"></uni-lit>
          ${viewManager.allColumnConfig.find(v => v.type === column.type)?.name}
        </div>`,
        type: 'sub-menu',
      },
    ],
    name: 'type',
    type: 'group',
  };
};
