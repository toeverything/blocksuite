import type { AffineImageToolbarWidget } from '@blocksuite/blocks';

import { html } from 'lit';

import type { AskAIButtonOptions } from '../../_common/components/ask-ai-button.js';

import '../../_common/components/ask-ai-button.js';
import { buildAIImageItemGroups } from '../../_common/config.js';

const AIImageItemGroups = buildAIImageItemGroups();
const buttonOptions: AskAIButtonOptions = {
  size: 'small',
  backgroundColor: 'var(--affine-white)',
  panelWidth: 300,
};

export function setupImageToolbarEntry(imageToolbar: AffineImageToolbarWidget) {
  imageToolbar.addConfigItems(
    [
      {
        type: 'ask-ai',
        when: ({ doc }) => !doc.readonly,
        generate: ({ host, blockComponent }) => {
          return {
            action: () => {
              const { selection } = host;
              selection.setGroup('note', [
                selection.create('image', { blockId: blockComponent.blockId }),
              ]);
            },
            render: item =>
              html`<ask-ai-button
                class="image-toolbar-button ask-ai"
                .host=${host}
                .actionGroups=${AIImageItemGroups}
                .toggleType=${'click'}
                .options=${buttonOptions}
                @click=${(e: MouseEvent) => {
                  e.stopPropagation();
                  item.action();
                }}
              ></ask-ai-button>`,
          };
        },
      },
    ],
    0
  );
}
