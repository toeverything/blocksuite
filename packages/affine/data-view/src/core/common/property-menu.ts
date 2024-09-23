import type {
  MenuOptions,
  NormalMenu,
} from '@blocksuite/affine-components/context-menu';

import { html } from 'lit/static-html.js';

import type { Property } from '../view-manager/property.js';

import { renderUniLit } from '../utils/uni-component/index.js';

export const inputConfig = (property: Property): MenuOptions['input'] => {
  return {
    icon: html`
      <div class="affine-database-column-type-menu-icon">
        ${renderUniLit(property.icon)}
      </div>
    `,
    divider: false,
    initValue: property.name$.value,
    onComplete: text => {
      property.nameSet(text);
    },
  };
};
export const typeConfig = (property: Property): NormalMenu => {
  return {
    type: 'sub-menu',
    name: 'Type',
    hide: () => !property.typeSet || property.type$.value === 'title',
    postfix: html`<div
      class="affine-database-column-type-icon"
      style="color: var(--affine-text-secondary-color);gap:4px"
    >
      ${renderUniLit(property.icon)}
      ${property.view.propertyMetas.find(v => v.type === property.type$.value)
        ?.config.name}
    </div>`,
    options: {
      input: {
        search: true,
      },
      items: property.view.propertyMetas.map(config => {
        return {
          type: 'action',
          isSelected: config.type === property.type$.value,
          name: config.config.name,
          icon: renderUniLit(property.view.IconGet(config.type)),
          select: () => {
            if (property.type$.value === config.type) {
              return;
            }
            property.typeSet?.(config.type);
          },
        };
      }),
    },
  };
};
