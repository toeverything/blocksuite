import { menu } from '@blocksuite/affine-components/context-menu';
import { IS_MOBILE } from '@blocksuite/global/env';
import { html } from 'lit/static-html.js';

import type { Property } from '../view-manager/property.js';

import { renderUniLit } from '../utils/uni-component/index.js';

export const inputConfig = (property: Property) => {
  if (IS_MOBILE) {
    return menu.input({
      prefix: html`
        <div class="affine-database-column-type-menu-icon">
          ${renderUniLit(property.icon)}
        </div>
      `,
      initialValue: property.name$.value,
      onChange: text => {
        property.nameSet(text);
      },
    });
  }
  return menu.input({
    prefix: html`
      <div class="affine-database-column-type-menu-icon">
        ${renderUniLit(property.icon)}
      </div>
    `,
    initialValue: property.name$.value,
    onComplete: text => {
      property.nameSet(text);
    },
  });
};
export const typeConfig = (property: Property) => {
  return menu.group({
    items: [
      menu.subMenu({
        name: 'Type',
        hide: () => !property.typeSet || property.type$.value === 'title',
        postfix: html` <div
          class="affine-database-column-type-icon"
          style="color: var(--affine-text-secondary-color);gap:4px;font-size: 14px;"
        >
          ${renderUniLit(property.icon)}
          ${property.view.propertyMetas.find(
            v => v.type === property.type$.value
          )?.config.name}
        </div>`,
        options: {
          title: {
            text: 'Property type',
          },
          items: [
            menu.group({
              items: property.view.propertyMetas.map(config => {
                return menu.action({
                  isSelected: config.type === property.type$.value,
                  name: config.config.name,
                  prefix: renderUniLit(
                    property.view.propertyIconGet(config.type)
                  ),
                  select: () => {
                    if (property.type$.value === config.type) {
                      return;
                    }
                    property.typeSet?.(config.type);
                  },
                });
              }),
            }),
          ],
        },
      }),
    ],
  });
};
