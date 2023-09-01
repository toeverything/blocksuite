import './frame-order-menu.js';
import '../../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { computePosition, offset } from '@floating-ui/dom';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { FrameOrderAdjustmentIcon } from '../../../../../icons/index.js';
import type { FrameElement } from '../../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import type { EdgelessFrameOrderMenu } from './frame-order-menu.js';

@customElement('edgeless-frame-order-button')
export class EdgelessFrameOrderButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameElement[];

  @property({ attribute: false })
  updateFrames!: () => void;

  @query('edgeless-frame-order-menu')
  private _edgelessFrameOrderMenu!: EdgelessFrameOrderMenu;

  @state()
  private _menuShow = false;

  override firstUpdated() {
    this._edgelessFrameOrderMenu.hidden = !this._menuShow;
  }

  private _toggleMenu() {
    this._menuShow = !this._menuShow;
    this._edgelessFrameOrderMenu.hidden = !this._menuShow;
    if (this._menuShow) {
      computePosition(this, this._edgelessFrameOrderMenu, {
        placement: 'top',
        middleware: [
          offset({
            mainAxis: 10,
          }),
        ],
      }).then(({ x, y }) => {
        Object.assign(this._edgelessFrameOrderMenu.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    }
  }

  protected override render() {
    return html`
      <edgeless-tool-icon-button
        @click=${() => {
          this._toggleMenu();
        }}
      >
        ${FrameOrderAdjustmentIcon}
      </edgeless-tool-icon-button>
      <edgeless-frame-order-menu
        .edgeless=${this.edgeless}
        .frames=${this.frames}
        .updateFrames=${this.updateFrames}
      >
      </edgeless-frame-order-menu>
    `;
  }
}
