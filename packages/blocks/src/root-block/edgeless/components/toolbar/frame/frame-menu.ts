import { css, html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { type EdgelessTool } from '../../../../../_common/utils/index.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { FrameConfig } from './config.js';
import { createFrame } from './service.js';

@customElement('edgeless-frame-menu')
export class EdgelessFrameMenu extends EdgelessToolbarToolMixin(LitElement) {
  protected override _type: EdgelessTool['type'] = 'frame';
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .frame-menu-container {
      display: flex;
      align-items: center;
      position: relative;
      cursor: default;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }

    .frame-add-button {
      border: 1px solid rgba(227, 226, 228, 1);
      border-radius: 2px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 400;
      line-height: 12px;
      letter-spacing: 0px;
      text-align: center;
      max-height: 20.49px;
      height: 20.49px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .frame-add-button:nth-of-type(1) {
      padding: 0px 3px;
    }

    .frame-add-button:nth-of-type(2) {
      width: 20.49px;
    }

    .frame-add-button:nth-of-type(3) {
      width: 27.31px;
    }
    .frame-add-button:nth-of-type(4) {
      width: 36.42px;
    }
    .frame-add-button:nth-of-type(5) {
      width: 40.97px;
    }
    .custom {
      background: rgba(0, 0, 0, 0.04);
      border: 0.640185px solid #e3e2e4;
      border-radius: 2px;
      color: #424149;
    }

    menu-divider {
      height: 20px;
    }
  `;

  override render() {
    if (this.edgelessTool.type !== 'frame') return nothing;
    const { edgeless } = this;
    return html`
      <div class="frame-menu-container">
        <edgeless-slide-menu .menuWidth=${304} .showNext=${false}>
          <div class="menu-content">
            <div class="frame-add-button custom">Custom</div>
            <menu-divider .vertical=${true}></menu-divider>
            ${repeat(
              FrameConfig,
              item => item.name,
              (item, index) => html`
                <div
                  @click=${() => createFrame(edgeless, item.wh)}
                  class="frame-add-button ${index}"
                >
                  ${item.name}
                </div>
              `
            )}
          </div>
        </edgeless-slide-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-menu': EdgelessFrameMenu;
  }
}
