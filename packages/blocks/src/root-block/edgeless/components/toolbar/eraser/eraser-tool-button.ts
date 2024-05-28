import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EdgelessEraserIcon } from '../../../../../_common/icons/index.js';
import { type EdgelessTool } from '../../../../../_common/utils/index.js';
import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

@customElement('edgeless-eraser-tool-button')
export class EdgelessEraserToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  override _type: EdgelessTool['type'] = 'eraser';
  static override styles = css`
    .eraser-button {
      position: relative;
      height: 66px;
      width: 60px;
      overflow-y: hidden;
    }
    .eraser-button .active-mode {
      position: absolute;
      top: 8px;
      left: 6px;
      width: 48px;
      height: 66px;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      background: var(--affine-hover-color);
    }
    #edgeless-eraser-icon {
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      transition: top 0.3s ease-in-out;
    }
    #edgeless-eraser-icon:hover {
      top: 0px;
    }
  `;

  override firstUpdated() {
    this.edgeless.bindHotKey(
      {
        Escape: () => {
          if (this.edgelessTool.type === 'eraser') {
            this.setEdgelessTool({ type: 'default' });
          }
        },
      },
      { global: true }
    );
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        class="edgeless-eraser-button"
        .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
        .tooltipOffset=${4}
        .active=${type === 'eraser'}
        @click=${() => this.setEdgelessTool({ type: 'eraser' })}
      >
        <div class="eraser-button">
          <div class=${type === 'eraser' ? 'active-mode' : ''}></div>
          ${EdgelessEraserIcon}
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-eraser-tool-button': EdgelessEraserToolButton;
  }
}
