import type {
  AffineCodeToolbarWidget,
  CodeBlockComponent,
} from '@blocksuite/blocks';

import { html } from 'lit';

import '../../_common/components/ask-ai-button.js';

const AICodeItemGroups = buildAICodeItemGroups();
const buttonOptions: AskAIButtonOptions = {
  panelWidth: 240,
  size: 'small',
};

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
  codeToolbar.setupDefaultConfig();
  codeToolbar.addItems(
    [
      {
        icon: AIStarIcon,
        name: 'Ask AI',
        render(codeBlock: CodeBlockComponent, onClick?: () => void) {
          return html`<ask-ai-button
            class="code-toolbar-button ask-ai"
            .host=${codeBlock.host}
            .actionGroups=${AICodeItemGroups}
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
        tooltip: 'Ask AI',
        type: 'custom',
      },
    ],
    0
  );
}
