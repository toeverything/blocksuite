import {
  BLOCK_ID_ATTR,
  CopyIcon,
  DeleteIcon,
  LineWrapIcon,
} from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { toolTipStyle } from '../../components/tooltip/tooltip.js';
import { copyCode } from '../../page-block/default/utils.js';

export function CodeOptionTemplate({
  model,
  position,
  hoverState,
  wrap,
  onClickWrap,
}: {
  position: { x: number; y: number };
  model: BaseBlockModel;
  hoverState: Slot<boolean>;
  wrap: boolean;
  onClickWrap: () => void;
}) {
  const page = model.page;
  const readonly = page.readonly;

  const style = {
    left: position.x + 'px',
    top: position.y + 'px',
  };
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${model.id}"] .ql-syntax`
  );
  if (!syntaxElem) return html``;

  return html`
    <style>
      .affine-codeblock-option-container > div {
          position: fixed;
          z-index: 1;
      }

      ${toolTipStyle}
    </style>

    <div
      class="affine-codeblock-option-container"
      @mouseover=${() => hoverState.emit(true)}
      @mouseout=${() => hoverState.emit(false)}
    >
      <div style=${styleMap(style)} class="code-block-option">
        <format-bar-button class="has-tool-tip" @click=${() => copyCode(model)}>
          ${CopyIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Copy to Clipboard</tool-tip
          >
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip"
          ?active=${wrap}
          @click=${onClickWrap}
        >
          ${LineWrapIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Wrap code</tool-tip
          >
        </format-bar-button>
        ${readonly
          ? ''
          : html`<format-bar-button
              class="has-tool-tip"
              @click=${() => {
                if (readonly) return;
                model.page.deleteBlock(model);
              }}
            >
              ${DeleteIcon}
              <tool-tip inert tip-position="right-start" role="tooltip"
                >Delete</tool-tip
              >
            </format-bar-button>`}
      </div>
    </div>
  `;
}
