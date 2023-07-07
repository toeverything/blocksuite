import {
  CancelWrapIcon,
  CopyIcon,
  DeleteIcon,
  WrapIcon,
} from '@blocksuite/global/config';
import type { Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { copyCode } from '../../page-block/default/utils.js';
import type { CodeBlockModel } from '../code-model.js';

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
    position: 'fixed',
    left: position.x + 'px',
    top: position.y + 'px',
  };

  return html`
    <style>
      .affine-codeblock-option {
        box-shadow: var(--affine-shadow-2);
        padding: 4px;
        border-radius: 8px;
        z-index: var(--affine-z-index-popover);
        background: var(--affine-background-overlay-panel-color);
      }

      ${tooltipStyle}
    </style>

    <div
      class="affine-codeblock-option"
      style=${styleMap(style)}
      @mouseover=${() => hoverState.emit(true)}
      @mouseout=${() => hoverState.emit(false)}
    >
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
        <tool-tip inert tip-position="right" role="tooltip">Wrap code</tool-tip>
      </icon-button>
      ${readonly
        ? nothing
        : html`<icon-button
            size="32px"
            data-testid="delete-button"
            class="has-tool-tip"
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
