import { menu } from '@blocksuite/affine-components/context-menu';
import { IS_MOBILE } from '@blocksuite/global/env';
import { html } from 'lit/static-html.js';

import { renderUniLit } from '../utils/uni-component/index.js';
import type { Property } from '../view-manager/property.js';

export const inputConfig = (property: Property) => {
  if (IS_MOBILE) {
    return menu.input({
      prefix: html`
        <div class="affine-database-column-type-menu-icon">
          ${renderUniLit(property.icon)}
        </div>
      `,
      initialValue: property.name$.value,
      placeholder: 'Property name',
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
    placeholder: 'Property name',
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
        hide: () => !property.typeCanSet,
        postfix: html` <div
          class="affine-database-column-type-icon"
          style="color: var(--affine-text-secondary-color);gap:4px;font-size: 14px;"
        >
          ${renderUniLit(property.icon)}
          ${property.view.propertyMetas$.value.find(
            v => v.type === property.type$.value
          )?.config.name}
        </div>`,
        options: {
          title: {
            text: 'Property type',
          },
          items: [
            menu.group({
              items: property.view.propertyMetas$.value.map(config => {
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
