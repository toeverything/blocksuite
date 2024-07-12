import type {
  AffineImageToolbarWidget,
  ImageBlockComponent,
} from '@blocksuite/blocks';

import { html } from 'lit';

import type { AskAIButtonOptions } from '../../_common/components/ask-ai-button.js';

import '../../_common/components/ask-ai-button.js';
import { buildAIImageItemGroups } from '../../_common/config.js';

const AIImageItemGroups = buildAIImageItemGroups();
const buttonOptions: AskAIButtonOptions = {
  backgroundColor: 'var(--affine-white)',
  panelWidth: 300,
  size: 'small',
};

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
  imageToolbar.addConfigItems(
    [
      {
        render(imageBlock: ImageBlockComponent, onClick?: () => void) {
          return html`<ask-ai-button
            class="image-toolbar-button ask-ai"
            .host=${imageBlock.host}
            .actionGroups=${AIImageItemGroups}
            .toggleType=${'click'}
            .options=${buttonOptions}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              onAskAIClick();
              onClick?.();
            }}
          ></ask-ai-button>`;
        },
        showWhen: () => true,
        type: 'custom',
      },
    ],
    0
  );
}
