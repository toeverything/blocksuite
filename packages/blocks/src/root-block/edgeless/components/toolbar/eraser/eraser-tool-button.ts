import {
  EdgelessEraserDarkIcon,
  EdgelessEraserLightIcon,
} from '@blocksuite/affine-components/icons';
import { css, html, LitElement } from 'lit';

import type { EdgelessTool } from '../../../types.js';

import { getTooltipWithShortcut } from '../../utils.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';

export class EdgelessEraserToolButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  static override styles = css`
    :host {
      height: 100%;
      overflow-y: hidden;
    }
    .eraser-button {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      position: relative;
      width: 49px;
      height: 64px;
    }
    #edgeless-eraser-icon {
      transition: transform 0.3s ease-in-out;
      transform: translateY(8px);
    }
    .eraser-button:hover #edgeless-eraser-icon,
    .eraser-button.active #edgeless-eraser-icon {
      transform: translateY(0);
    }
  `;

  override enableActiveBackground = true;

  override type: EdgelessTool['type'] = 'eraser';

  override firstUpdated() {
    this.disposables.add(
      this.edgeless.bindHotKey(
        {
          Escape: () => {
            if (this.edgelessTool.type === 'eraser') {
              this.setEdgelessTool({ type: 'default' });
            }
          },
        },
        { global: true }
      )
    );
  }

  override render() {
    const type = this.edgelessTool?.type;
    const { theme } = this;

    const icon =
      theme === 'dark' ? EdgelessEraserDarkIcon : EdgelessEraserLightIcon;

    return html`
      <edgeless-toolbar-button
        class="edgeless-eraser-button"
        .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
        .tooltipOffset=${4}
        .active=${type === 'eraser'}
        @click=${() => this.setEdgelessTool({ type: 'eraser' })}
      >
        <div class="eraser-button">${icon}</div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-eraser-tool-button': EdgelessEraserToolButton;
  }
}
