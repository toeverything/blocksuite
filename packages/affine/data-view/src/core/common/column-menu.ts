import type {
  MenuOptions,
  NormalMenu,
} from '@blocksuite/affine-components/context-menu';

import { html } from 'lit/static-html.js';

import type { Property } from '../view-manager/property.js';

import { renderUniLit } from '../utils/uni-component/index.js';

export const inputConfig = (column: Property): MenuOptions['input'] => {
  return {
    icon: html`
      <div class="affine-database-column-type-menu-icon">
        ${renderUniLit(column.icon)}
      </div>
    `,
    divider: false,
    initValue: column.name$.value,
    onComplete: text => {
      column.nameSet(text);
    },
  };
};
export const typeConfig = (column: Property): NormalMenu => {
  return {
    type: 'sub-menu',
    name: 'Type',
    hide: () => !column.typeSet || column.type$.value === 'title',
    postfix: html`<div
      class="affine-database-column-type-icon"
      style="color: var(--affine-text-secondary-color);gap:4px"
    >
      ${renderUniLit(column.icon)}
      ${column.view.propertyMetas.find(v => v.type === column.type$.value)
        ?.config.name}
    </div>`,
    options: {
      input: {
        search: true,
      },
      items: column.view.propertyMetas.map(config => {
        return {
          type: 'action',
          isSelected: config.type === column.type$.value,
          name: config.config.name,
          icon: renderUniLit(column.view.IconGet(config.type)),
          select: () => {
            if (column.type$.value === config.type) {
              return;
            }
            column.typeSet?.(config.type);
          },
        };
      }),
    },
  };
};
