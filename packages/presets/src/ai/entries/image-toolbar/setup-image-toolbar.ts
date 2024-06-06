import '../../_common/components/ask-ai-button.js';

import type {
  AffineImageToolbarWidget,
  ImageBlockComponent,
} from '@blocksuite/blocks';
import { html } from 'lit';

import type { AskAIButtonOptions } from '../../_common/components/ask-ai-button.js';
import { buildAIImageItemGroups } from '../../_common/config.js';

export function setupImageToolbarEntry(imageToolbar: AffineImageToolbarWidget) {
  const onAskAIClick = () => {
    const { host } = imageToolbar;
    const { selection } = host;
    const imageBlock = imageToolbar.blockElement;
    selection.setGroup('note', [
      selection.create('image', { blockId: imageBlock.blockId }),
    ]);
  };
  imageToolbar.buildDefaultConfig();
  const AIImageItemGroups = buildAIImageItemGroups();
  const buttonOptions: AskAIButtonOptions = {
    toggleType: 'click',
    size: 'small',
    backgroundColor: 'var(--affine-white)',
    boxShadow: 'var(--affine-shadow-1)',
    panelWidth: 300,
  };
  imageToolbar.addConfigItems(
    [
      {
        type: 'custom',
        render(imageBlock: ImageBlockComponent, onClick?: () => void) {
          return html`<ask-ai-button
            class="image-toolbar-button ask-ai"
            .host=${imageBlock.host}
            .actionGroups=${AIImageItemGroups}
            .options=${buttonOptions}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              onAskAIClick();
              onClick?.();
            }}
          ></ask-ai-button>`;
        },
        showWhen: () => true,
      },
    ],
    0
  );
}
