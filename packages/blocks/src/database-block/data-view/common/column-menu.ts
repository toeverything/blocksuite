import { html } from 'lit/static-html.js';

import type {
  MenuOptions,
  NormalMenu,
} from '../../../_common/components/menu/index.js';
import type { Column } from '../view-manager/column.js';

import { renderUniLit } from '../utils/uni-component/index.js';

export const inputConfig = (column: Column): MenuOptions['input'] => {
  return {
    icon: html`
      <div class="affine-database-column-type-menu-icon">
        ${renderUniLit(column.icon)}
      </div>
    `,
    divider: false,
    initValue: column.name$.value,
    onComplete: text => {
      column.updateName(text);
    },
  };
};
export const typeConfig = (column: Column): NormalMenu => {
  return {
    type: 'sub-menu',
    name: 'Type',
    hide: () => !column.updateType || column.type$.value === 'title',
    postfix: html`<div
      class="affine-database-column-type-icon"
      style="color: var(--affine-text-secondary-color);gap:4px"
    >
      ${renderUniLit(column.icon)}
      ${column.view.allColumnConfig.find(v => v.type === column.type$.value)
        ?.name}
    </div>`,
    options: {
      input: {
        search: true,
      },
      items: column.view.allColumnConfig.map(config => {
        return {
          type: 'action',
          isSelected: config.type === column.type$.value,
          name: config.name,
          icon: renderUniLit(column.view.getIcon(config.type)),
          select: () => {
            if (column.type$.value === config.type) {
              return;
            }
            column.updateType?.(config.type);
          },
        };
      }),
    },
  };
};
