import type { GfxToolsFullOptionValue } from '@blocksuite/block-std/gfx';

import { css, html, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { FrameConfig } from './config.js';

export class EdgelessFrameMenu extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }

    .frame-add-button {
      width: 40px;
      height: 24px;
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
      color: var(--affine-text-primary-color);
      line-height: 20px;
      font-weight: 400;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }

    .frame-add-button::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      border-radius: 3px;
      background: transparent;
      transition: background-color 0.23s ease;
      pointer-events: none;
    }
    .frame-add-button:hover::before {
      background: var(--affine-hover-color);
    }

    .custom {
      width: 60px;
      background: var(--affine-hover-color);
    }

    .divider {
      width: 1px;
      height: 20px;
      background: var(--affine-border-color);
      transform: scaleX(0.5);
    }
  `;

  override type: GfxToolsFullOptionValue['type'] = 'frame';

  override render() {
    const { edgeless } = this;
    return html`
      <edgeless-slide-menu .showNext=${false}>
        <div class="menu-content">
          <div class="frame-add-button custom">Custom</div>
          <div class="divider"></div>
          ${repeat(
            FrameConfig,
            item => item.name,
            (item, index) => html`
              <div
                @click=${() => {
                  edgeless.gfx.tool.setTool('default');
                  edgeless.service.frame.createFrameOnViewportCenter(item.wh);
                }}
                class="frame-add-button ${index}"
                data-name="${item.name}"
                data-w="${item.wh[0]}"
                data-h="${item.wh[1]}"
              >
                ${item.name}
              </div>
            `
          )}
        </div>
      </edgeless-slide-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-menu': EdgelessFrameMenu;
  }
}
