import {
  BLOCK_ID_ATTR,
  CopyIcon,
  DeleteIcon,
  LineWrapIcon,
} from '@blocksuite/global/config';
import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { type CodeBlockOption, copyCode, toolTipStyle } from '../../index.js';

export function toggleWrap(codeBlockOption: CodeBlockOption) {
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  assertExists(syntaxElem);
  syntaxElem.classList.toggle('wrap');
}

export function CodeBlockOptionContainer(codeBlockOption: {
  position: { x: number; y: number };
  model: BaseBlockModel;
  hoverState: Slot<boolean>;
}) {
  const page = codeBlockOption.model.page;
  const readonly = page.readonly;

  const style = {
    left: codeBlockOption.position.x + 'px',
    top: codeBlockOption.position.y + 'px',
  };
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  if (!syntaxElem) return html``;

  const isWrapped = syntaxElem.classList.contains('wrap');
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
      @mouseover=${() => codeBlockOption.hoverState.emit(true)}
      @mouseout=${() => codeBlockOption.hoverState.emit(false)}
    >
      <div style=${styleMap(style)} class="code-block-option">
        <format-bar-button
          class="has-tool-tip"
          @click=${() => copyCode(codeBlockOption)}
        >
          ${CopyIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Copy to Clipboard
          </tool-tip>
        </format-bar-button>
        <format-bar-button
          class="has-tool-tip ${isWrapped ? 'filled' : ''}"
          @click=${() => toggleWrap(codeBlockOption)}
        >
          ${LineWrapIcon}
          <tool-tip inert tip-position="right-start" role="tooltip"
            >Wrap code
          </tool-tip>
        </format-bar-button>
        ${readonly
          ? ''
          : html`<format-bar-button
              class="has-tool-tip"
              @click=${() => {
                const model = codeBlockOption.model;
                model.page.deleteBlock(model);
              }}
            >
              ${DeleteIcon}
              <tool-tip inert tip-position="right-start" role="tooltip"
                >Delete
              </tool-tip>
            </format-bar-button>`}
      </div>
    </div>
  `;
}
