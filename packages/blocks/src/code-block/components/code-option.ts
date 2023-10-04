import type { BaseBlockModel } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

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
      :host {
        z-index: 1;
      }
      .affine-codeblock-option {
        box-shadow: var(--affine-shadow-2);
        padding: 8px;
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
    </style>

    <div ${ref(containerRef)} class="affine-codeblock-option">
      <icon-button
        size="32px"
        data-testid="copy-button"
        @click=${() => copyCode(model as CodeBlockModel)}
      >
        ${CopyIcon}
        <blocksuite-tooltip tip-position="right" .offset=${12}
          >Copy to Clipboard</blocksuite-tooltip
        >
      </icon-button>
      <icon-button
        size="32px"
        data-testid="wrap-button"
        ?active=${wrap}
        @click=${onClickWrap}
      >
        ${wrap ? CancelWrapIcon : WrapIcon}
        <blocksuite-tooltip tip-position="right" .offset=${12}
          >${wrap ? 'Cancel wrap' : 'Wrap code'}</blocksuite-tooltip
        >
      </icon-button>
      ${readonly
        ? nothing
        : html`<icon-button
            size="32px"
            data-testid="delete-button"
            class="delete-code-button"
            @click=${() => {
              if (readonly) return;
              model.page.deleteBlock(model);
            }}
          >
            ${DeleteIcon}
            <blocksuite-tooltip tip-position="right" .offset=${12}
              >Delete</blocksuite-tooltip
            >
          </icon-button>`}
    </div>
  `;
}
