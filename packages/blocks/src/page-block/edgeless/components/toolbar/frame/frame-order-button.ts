import './frame-order-menu.js';
import '../../buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { FrameOrderAdjustmentIcon } from '../../../../../_common/icons/index.js';
import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createButtonPopper } from '../../utils.js';
import type { EdgelessFrameOrderMenu } from './frame-order-menu.js';

@customElement('edgeless-frame-order-button')
export class EdgelessFrameOrderButton extends WithDisposable(LitElement) {
  static override styles = css`
    edgeless-frame-order-menu {
      display: none;
    }

    edgeless-frame-order-menu[data-show] {
      display: initial;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameBlockModel[];

  @property({ attribute: false })
  updateFrames!: () => void;

  @query('.edgeless-frame-order-button')
  private _edgelessFrameOrderButton!: HTMLElement;

  @query('edgeless-frame-order-menu')
  private _edgelessFrameOrderMenu!: EdgelessFrameOrderMenu;
  private _edgelessFrameOrderPopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

  @state()
  private _popperShow = false;

  override firstUpdated() {
    this._edgelessFrameOrderPopper = createButtonPopper(
      this._edgelessFrameOrderButton,
      this._edgelessFrameOrderMenu,
      ({ display }) => (this._popperShow = display === 'show')
    );
  }

  protected override render() {
    const { readonly } = this.edgeless.page;
    return html`
      <style>
        .edgeless-frame-order-button svg {
          color: ${readonly ? 'var(--affine-text-disable-color)' : 'inherit'};
        }
      </style>
      <edgeless-tool-icon-button
        class="edgeless-frame-order-button"
        .tooltip=${this._popperShow ? '' : 'Frame Order'}
        @click=${() => {
          if (readonly) return;
          this._edgelessFrameOrderPopper?.toggle();
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
