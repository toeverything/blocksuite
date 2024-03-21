import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { type EdgelessTool } from '../../../../../_common/utils/index.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';

export const FrameConfig = [
  { name: '1:1', wh: [1200, 1200] },
  { name: '4:3', wh: [1600, 1200] },
  { name: '16:9', wh: [1600, 900] },
  { name: '2:1', wh: [1600, 800] },
];

@customElement('edgeless-frame-menu')
export class EdgelessFrameMenu extends WithDisposable(LitElement) {
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

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  override render() {
    if (this.edgelessTool.type !== 'frame') return nothing;
    const { edgeless } = this;
    const { surface } = edgeless;
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
                  @click=${() => {
                    const frames = edgeless.service.frames;
                    const center = edgeless.service.viewport.center;
                    const bound = new Bound(
                      center.x - item.wh[0] / 2,
                      center.y - item.wh[1] / 2,
                      item.wh[0],
                      item.wh[1]
                    );
                    const id = edgeless.service.addBlock(
                      'affine:frame',
                      {
                        title: new DocCollection.Y.Text(
                          `Frame ${frames.length + 1}`
                        ),
                        xywh: bound.serialize(),
                      },
                      surface.model
                    );
                    edgeless.doc.captureSync();
                    const frame = edgeless.service.getElementById(id);
                    assertExists(frame);
                    edgeless.tools.setEdgelessTool({ type: 'default' });
                    edgeless.service.selection.set({
                      elements: [frame.id],
                      editing: false,
                    });
                  }}
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
