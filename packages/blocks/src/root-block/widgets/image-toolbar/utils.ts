import '../../../_common/components/button.js';
import '../../../_common/components/tooltip/tooltip.js';

import { assertExists } from '@blocksuite/global/utils';
import { html, type TemplateResult } from 'lit';

import { getBlockProps } from '../../../_common/utils/block-props.js';
import { isInsidePageEditor } from '../../../_common/utils/query.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type {
  CommonItem,
  CustomItem,
  ImageConfigItem,
  MoreItem,
  MoreMenuConfigItem,
} from './type.js';

export function ConfigRenderer(
  blockElement: ImageBlockComponent,
  abortController: AbortController,
  config: ImageConfigItem[],
  onClick?: () => void
) {
  return config
    .filter(item => {
      return item.showWhen(blockElement);
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'common': {
          const defaultItem = item as CommonItem;
          const buttonClass = `image-toolbar-button ${defaultItem.name.toLocaleLowerCase()}`;
          template = html`<div class=${buttonClass}>
            <icon-button
              size="24px"
              @click=${() => defaultItem.action(blockElement, abortController)}
            >
              ${defaultItem.icon}
              <affine-tooltip>${defaultItem.tooltip}</affine-tooltip>
            </icon-button>
          </div>`;
          break;
        }
        case 'custom': {
          const customItem = item as CustomItem;
          template = customItem.render(blockElement, onClick);
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
  blockElement: ImageBlockComponent,
  abortController: AbortController,
  config: MoreMenuConfigItem[]
) {
  return config
    .filter(item => {
      return item.showWhen(blockElement);
    })
    .map(item => {
      let template: TemplateResult | null = null;
      switch (item.type) {
        case 'more': {
          const moreItem = item as MoreItem;
          const buttonClass = `menu-item ${moreItem.name.toLocaleLowerCase()}`;
          template = html`<div class=${buttonClass}>
            <icon-button
              width="183px"
              height="30px"
              text=${moreItem.name}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                moreItem.action(blockElement, abortController);
              }}
            >
              ${moreItem.icon}
            </icon-button>
          </div>`;
          break;
        }
        case 'divider': {
          template = html`<div class="divider"></div>`;
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
  blockElement: ImageBlockComponent,
  abortController?: AbortController
) {
  const model = blockElement.model;
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

  const editorHost = blockElement.host;
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
