import '../../_common/components/ask-ai-button.js';

import {
  type AffineCodeToolbarWidget,
  type CodeBlockComponent,
} from '@blocksuite/blocks';
import { html } from 'lit';

import type { AskAIButtonOptions } from '../../_common/components/ask-ai-button.js';
import { buildAICodeItemGroups } from '../../_common/config.js';
import { AIStarIcon } from '../../_common/icons.js';

export function setupCodeToolbarEntry(codeToolbar: AffineCodeToolbarWidget) {
  const onAskAIClick = () => {
    const { host } = codeToolbar;
    const { selection } = host;
    const imageBlock = codeToolbar.blockElement;
    selection.setGroup('note', [
      selection.create('block', { blockId: imageBlock.blockId }),
    ]);
  };
  const AICodeItemGroups = buildAICodeItemGroups();
  codeToolbar.setupDefaultConfig();
  const buttonOptions: AskAIButtonOptions = {
    toggleType: 'click',
    size: 'small',
    panelWidth: 240,
  };
  codeToolbar.addItems(
    [
      {
        type: 'custom',
        name: 'Ask AI',
        tooltip: 'Ask AI',
        icon: AIStarIcon,
        showWhen: () => true,
        render(codeBlock: CodeBlockComponent, onClick?: () => void) {
          return html`<ask-ai-button
            class="code-toolbar-button ask-ai"
            .host=${codeBlock.host}
            .actionGroups=${AICodeItemGroups}
            .options=${buttonOptions}
            @click=${(e: MouseEvent) => {
              e.stopPropagation();
              onAskAIClick();
              onClick?.();
            }}
          ></ask-ai-button>`;
        },
      },
    ],
    0
  );
}
