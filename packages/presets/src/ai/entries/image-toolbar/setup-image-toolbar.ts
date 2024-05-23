import '../../_common/components/ask-ai-button.js';

import type {
  AffineImageToolbarWidget,
  ImageBlockComponent,
} from '@blocksuite/blocks';
import { html } from 'lit';

import { AIImageItemGroups } from '../../_common/config.js';

export function setupImageToolbarEntry(imageToolbar: AffineImageToolbarWidget) {
  console.log('setupImageToolbarEntry');
  imageToolbar.buildDefaultConfig();
  imageToolbar.addConfigItems(
    [
      {
        type: 'custom',
        render(imageBlock: ImageBlockComponent) {
          return html`<ask-ai-button
            class="image-toolbar-button ask-ai"
            .host=${imageBlock.host}
            .actionGroups=${AIImageItemGroups}
            .size=${'small'}
            .backgroundColor=${'var(--affine-white)'}
            .boxShadow=${'var(--affine-shadow-1)'}
          ></ask-ai-button>`;
        },
        showWhen: () => true,
      },
    ],
    0
  );
}
