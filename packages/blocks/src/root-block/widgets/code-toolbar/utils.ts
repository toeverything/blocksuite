import type { CodeBlockModel } from '@blocksuite/affine-model';

import { type TemplateResult, html } from 'lit';

import type { CodeBlockComponent } from '../../../code-block/index.js';
import type {
  CodeToolbarItem,
  CodeToolbarMoreItem,
  MoreItem,
} from './types.js';

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
  codeBlock: CodeBlockComponent,
  onClick?: () => void
) {
  return items
    .filter(item => item.showWhen(codeBlock))
    .map(item => {
      switch (item.type) {
        case 'action':
          return html`
            <editor-icon-button
              class="code-toolbar-button ${item.name}"
              data-testid=${item.name}
              .tooltip=${item.tooltip}
              .tooltipOffset=${4}
              @click=${() => item.action(codeBlock, onClick)}
            >
              ${item.icon}
            </editor-icon-button>
          `;
        case 'custom':
          return item.render(codeBlock, onClick);
        default:
          return null;
      }
    })
    .filter(item => item !== null);
}

export function MoreMenuRenderer(
  block: CodeBlockComponent,
  abortController: AbortController,
  config: CodeToolbarMoreItem[]
) {
  return config
    .filter(item => {
      return item.type === 'divider' || item.showWhen(block);
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'more': {
          const moreItem = item as MoreItem;
          const name =
            moreItem.name instanceof Function
              ? moreItem.name(block)
              : moreItem.name;
          const icon =
            moreItem.icon instanceof Function
              ? moreItem.icon(block)
              : moreItem.icon;
          const buttonClass = `menu-item ${name.toLocaleLowerCase().split(' ').join('-')}`;
          template = html`
            <editor-menu-action
              class=${buttonClass}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                moreItem.action(block, abortController);
              }}
            >
              ${icon} ${name}
            </editor-menu-action>
          `;
          break;
        }
        case 'divider': {
          template = html`
            <editor-toolbar-separator
              data-orientation="horizontal"
            ></editor-toolbar-separator>
          `;
          break;
        }
        default:
          template = null;
      }

      return template;
    })
    .filter((template): template is TemplateResult => template !== null)
    .map(template => template);
}
