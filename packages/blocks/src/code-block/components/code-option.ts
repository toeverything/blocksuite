import type { BaseBlockModel } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import {
  CancelWrapIcon,
  CopyIcon,
  DeleteIcon,
  WrapIcon,
} from '../../icons/index.js';
import { copyCode } from '../../page-block/doc/utils.js';
import type { CodeBlockModel } from '../code-model.js';

export function CodeOptionTemplate({
  ref: containerRef,
  model,
  wrap,
  onClickWrap,
}: {
  ref?: RefOrCallback;
  anchor: HTMLElement;
  model: BaseBlockModel;
  wrap: boolean;
  abortController: AbortController;
  onClickWrap: () => void;
}) {
  const page = model.page;
  const readonly = page.readonly;

  return html`
    <style>
      .affine-codeblock-option {
        box-shadow: var(--affine-shadow-2);
        padding: 4px;
        border-radius: 8px;
        z-index: var(--affine-z-index-popover);
        background: var(--affine-background-overlay-panel-color);
      }
      .delete-code-button:hover {
        background: var(--affine-background-error-color);
        color: var(--affine-error-color);
      }
      .delete-code-button:hover > svg {
        color: var(--affine-error-color);
      }

      ${tooltipStyle}
    </style>

    <div ${ref(containerRef)} class="affine-codeblock-option">
      <icon-button
        size="32px"
        class="has-tool-tip"
        data-testid="copy-button"
        @click=${() => copyCode(model as CodeBlockModel)}
      >
        ${CopyIcon}
        <tool-tip inert tip-position="right" role="tooltip"
          >Copy to Clipboard</tool-tip
        >
      </icon-button>
      <icon-button
        size="32px"
        class="has-tool-tip"
        data-testid="wrap-button"
        ?active=${wrap}
        @click=${onClickWrap}
      >
        ${wrap ? CancelWrapIcon : WrapIcon}
        <tool-tip inert tip-position="right" role="tooltip"
          >${wrap ? 'Cancel wrap' : 'Wrap code'}</tool-tip
        >
      </icon-button>
      ${readonly
        ? nothing
        : html`<icon-button
            size="32px"
            data-testid="delete-button"
            class="has-tool-tip delete-code-button"
            @click=${() => {
              if (readonly) return;
              model.page.deleteBlock(model);
            }}
          >
            ${DeleteIcon}
            <tool-tip inert tip-position="right" role="tooltip"
              >Delete</tool-tip
            >
          </icon-button>`}
    </div>
  `;
}
