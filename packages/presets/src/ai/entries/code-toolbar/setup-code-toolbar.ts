import '../../_common/components/ask-ai-button.js';

import {
  type AffineCodeToolbarWidget,
  type CodeBlockComponent,
} from '@blocksuite/blocks';
import { html } from 'lit';

import { AICodeItemGroups } from '../../_common/config.js';
import { AIStarIcon } from '../../_common/icons.js';

export function setupCodeToolbarEntry(codeToolbar: AffineCodeToolbarWidget) {
  codeToolbar.setupDefaultConfig();
  codeToolbar.addItems(
    [
      {
        type: 'custom',
        name: 'Ask AI',
        tooltip: 'Ask AI',
        icon: AIStarIcon,
        showWhen: () => true,
        render(codeBlock: CodeBlockComponent) {
          return html`<ask-ai-button
            class="code-toolbar-button ask-ai"
            .host=${codeBlock.host}
            .actionGroups=${AICodeItemGroups}
            .size=${'small'}
            .boxShadow=${'var(--affine-shadow-1)'}
          ></ask-ai-button>`;
        },
      },
    ],
    0
  );
}
