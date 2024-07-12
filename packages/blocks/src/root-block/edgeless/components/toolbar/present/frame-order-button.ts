import { WithDisposable } from '@blocksuite/block-std';
import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { EdgelessFrameOrderMenu } from './frame-order-menu.js';

import { FrameOrderAdjustmentIcon } from '../../../../../_common/icons/index.js';
import { createButtonPopper } from '../../../../../_common/utils/button-popper.js';
import '../../buttons/tool-icon-button.js';
import './frame-order-menu.js';

@customElement('edgeless-frame-order-button')
export class EdgelessFrameOrderButton extends WithDisposable(LitElement) {
  private _edgelessFrameOrderPopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

  static override styles = css`
    edgeless-frame-order-menu {
      display: none;
    }

    edgeless-frame-order-menu[data-show] {
      display: initial;
    }
  `;

  override firstUpdated() {
    this._edgelessFrameOrderPopper = createButtonPopper(
      this._edgelessFrameOrderButton,
      this._edgelessFrameOrderMenu,
      ({ display }) => this.setPopperShow(display === 'show'),
      {
        mainAxis: 22,
      }
    );
  }

  protected override render() {
    const { readonly } = this.edgeless.doc;
    return html`
      <style>
        .edgeless-frame-order-button svg {
          color: ${readonly ? 'var(--affine-text-disable-color)' : 'inherit'};
        }
      </style>
      <edgeless-tool-icon-button
        class="edgeless-frame-order-button"
        .tooltip=${this.popperShow ? '' : 'Frame Order'}
        @click=${() => {
          if (readonly) return;
          this._edgelessFrameOrderPopper?.toggle();
        }}
        .iconContainerPadding=${0}
      >
        ${FrameOrderAdjustmentIcon}
      </edgeless-tool-icon-button>
      <edgeless-frame-order-menu
        .edgeless=${this.edgeless}
        .frames=${this.frames}
      >
      </edgeless-frame-order-menu>
    `;
  }

  @query('.edgeless-frame-order-button')
  private accessor _edgelessFrameOrderButton!: HTMLElement;

  @query('edgeless-frame-order-menu')
  private accessor _edgelessFrameOrderMenu!: EdgelessFrameOrderMenu;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor frames!: FrameBlockModel[];

  @property({ attribute: false })
  accessor popperShow = false;

  @property({ attribute: false })
  accessor setPopperShow: (show: boolean) => void = () => {};
}
