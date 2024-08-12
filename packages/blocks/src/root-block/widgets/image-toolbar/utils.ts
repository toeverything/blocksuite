import { getBlockProps } from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';
import { type TemplateResult, html } from 'lit';

import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type {
  CommonItem,
  CustomItem,
  ImageConfigItem,
  MoreItem,
  MoreMenuConfigItem,
} from './type.js';

import { isInsidePageEditor } from '../../../_common/utils/query.js';

export function ConfigRenderer(
  block: ImageBlockComponent,
  abortController: AbortController,
  config: ImageConfigItem[],
  onClick?: () => void
) {
  return config
    .filter(item => {
      return item.showWhen(block);
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'common': {
          const defaultItem = item as CommonItem;
          const buttonClass = `image-toolbar-button ${defaultItem.name.toLocaleLowerCase()}`;
          template = html`
            <editor-icon-button
              class=${buttonClass}
              .tooltip=${defaultItem.tooltip}
              .tooltipOffset=${4}
              @click=${() => defaultItem.action(block, abortController)}
            >
              ${defaultItem.icon}
            </editor-icon-button>
          `;
          break;
        }
        case 'custom': {
          const customItem = item as CustomItem;
          template = customItem.render(block, onClick);
          break;
        }
        default:
          template = null;
      }

      return [template] as const;
    })
    .filter(([template]) => template !== null && template !== undefined)
    .map(([template]) => template);
}

export function MoreMenuRenderer(
  block: ImageBlockComponent,
  abortController: AbortController,
  config: MoreMenuConfigItem[]
) {
  return config
    .filter(item => {
      return item.showWhen(block);
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'more': {
          const moreItem = item as MoreItem;
          const buttonClass = `menu-item ${moreItem.name.toLocaleLowerCase()}`;
          template = html`
            <editor-menu-action
              class=${buttonClass}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                moreItem.action(block, abortController);
              }}
            >
              ${moreItem.icon} ${moreItem.name}
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

export function duplicate(
  block: ImageBlockComponent,
  abortController?: AbortController
) {
  const model = block.model;
  const blockProps = getBlockProps(model);
  const { width, height, xywh, rotate, zIndex, ...duplicateProps } = blockProps;

  const { doc } = model;
  const parent = doc.getParent(model);
  assertExists(parent, 'Parent not found');

  const index = parent?.children.indexOf(model);
  const duplicateId = doc.addBlock(
    model.flavour as BlockSuite.Flavour,
    duplicateProps,
    parent,
    index + 1
  );
  abortController?.abort();

  const editorHost = block.host;
  editorHost.updateComplete
    .then(() => {
      const { selection } = editorHost;
      selection.setGroup('note', [
        selection.create('block', {
          blockId: duplicateId,
        }),
      ]);
      if (isInsidePageEditor(editorHost)) {
        const duplicateElement = editorHost.view.getBlock(duplicateId);
        if (duplicateElement) {
          duplicateElement.scrollIntoView(true);
        }
      }
    })
    .catch(console.error);
}
