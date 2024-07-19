import { html } from 'lit/static-html.js';

import type {
  MenuOptions,
  NormalMenu,
} from '../../../_common/components/menu/index.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../view/data-view-manager.js';

export const inputConfig = (
  column: DataViewColumnManager
): MenuOptions['input'] => {
  return {
    icon: html`
      <div class="affine-database-column-type-menu-icon">
        <uni-lit .uni="${column.icon}"></uni-lit>
      </div>
    `,
    divider: false,
    initValue: column.name,
    onComplete: text => {
      column.updateName(text);
    },
  };
};
export const typeConfig = (
  column: DataViewColumnManager,
  viewManager: DataViewManager
): NormalMenu => {
  return {
    type: 'sub-menu',
    name: 'Type',
    hide: () => !column.updateType || column.type === 'title',
    postfix: html`<div
      class="affine-database-column-type-icon"
      style="color: var(--affine-text-secondary-color);gap:4px"
    >
      <uni-lit .uni="${column.icon}"></uni-lit>
      ${viewManager.allColumnConfig.find(v => v.type === column.type)?.name}
    </div>`,
    options: {
      input: {
        search: true,
      },
      items: viewManager.allColumnConfig.map(config => {
        return {
          type: 'action',
          isSelected: config.type === column.type,
          name: config.name,
          icon: html` <uni-lit
            .uni="${viewManager.getIcon(config.type)}"
          ></uni-lit>`,
          select: () => {
            if (column.type === config.type) {
              return;
            }
            column.updateType?.(config.type);
          },
        };
      }),
    },
  };
};
