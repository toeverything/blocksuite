import { html } from 'lit';

import type {
  CodeBlockComponent,
  CodeBlockModel,
} from '../../../code-block/index.js';
import type { CodeToolbarItem, CodeToolbarMoreItem } from './types.js';

export const duplicateCodeBlock = (model: CodeBlockModel) => {
  const keys = model.keys as (keyof typeof model)[];
  const values = keys.map(key => model[key]);
  const blockProps = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  const { text, ...duplicateProps } = blockProps;

  const newProps = {
    flavour: model.flavour,
    text: model.text.clone(),
    ...duplicateProps,
  };

  return model.doc.addSiblingBlocks(model, [newProps])[0];
};

export function CodeToolbarItemRenderer(
  items: CodeToolbarItem[],
  codeBlock: CodeBlockComponent
) {
  return items
    .filter(item => item.showWhen(codeBlock))
    .map(item => {
      switch (item.type) {
        case 'action':
          return html`
            <icon-button
              class="code-toolbar-button ${item.name}"
              data-testid=${item.name}
              size="24px"
              @click=${() => item.action(codeBlock)}
            >
              ${item.icon}
              <affine-tooltip tip-position="top" .offset=${5}
                >${item.tooltip}</affine-tooltip
              >
            </icon-button>
          `;
        case 'custom':
          return item.render(codeBlock);
        default:
          return null;
      }
    })
    .filter(item => item !== null);
}

export function CodeToolbarMoreMenuBuilder(
  items: CodeToolbarMoreItem[],
  codeBlock: CodeBlockComponent
) {
  return items
    .filter(item => item.showWhen(codeBlock))
    .map(item => item.render(codeBlock));
}
