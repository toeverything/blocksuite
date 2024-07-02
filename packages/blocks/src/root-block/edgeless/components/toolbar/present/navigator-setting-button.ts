import './frame-order-menu.js';
import '../../buttons/tool-icon-button.js';
import '../../../../../_common/components/toggle-switch.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { NavigatorSettingsIcon } from '../../../../../_common/icons/edgeless.js';
import { createButtonPopper } from '../../../../../_common/utils/button-popper.js';
import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';

@customElement('edgeless-navigator-setting-button')
export class EdgelessNavigatorSettingButton extends WithDisposable(LitElement) {
  static override styles = css`
    .navigator-setting-menu {
      display: none;
      padding: 8px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      color: var(--affine-text-primary-color);
    }

    .navigator-setting-menu[data-show] {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-container {
      padding: 4px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 264px;
      width: 100%;
      box-sizing: border-box;
    }
    .item-container.header {
      height: 34px;
    }

    .text {
      padding: 0px 4px;
      line-height: 22px;
      font-size: var(--affine-font-sm);
      color: var(--affine-text-primary-color);
    }

    .text.title {
      font-weight: 500;
      line-height: 20px;
      font-size: var(--affine-font-xs);
      color: var(--affine-text-secondary-color);
    }

    .divider {
      width: 100%;
      height: 16px;
      display: flex;
      align-items: center;
    }
    .divider::before {
      content: '';
      width: 100%;
      height: 1px;
      background: var(--affine-border-color);
    }
  `;

  @query('.navigator-setting-button')
  private accessor _navigatorSettingButton!: HTMLElement;

  @query('.navigator-setting-menu')
  private accessor _navigatorSettingMenu!: HTMLElement;

  private _navigatorSettingPopper?: ReturnType<
    typeof createButtonPopper
  > | null = null;

  @state()
  accessor blackBackground = true;

  @property({ attribute: false })
  accessor includeFrameOrder = false;

  @property({ attribute: false })
  accessor frames!: FrameBlockModel[];

  @property({ attribute: false })
  accessor popperShow = false;

  @property({ attribute: false })
  accessor hideToolbar = false;

  @property({ attribute: false })
  accessor onHideToolbarChange: undefined | ((hideToolbar: boolean) => void) =
    undefined;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _tryRestoreSettings() {
    const blackBackground = this.edgeless.service.editPropsStore.getStorage(
      'presentBlackBackground'
    );
    this.blackBackground = blackBackground ?? true;
  }

  private _onBlackBackgroundChange = (checked: boolean) => {
    this.blackBackground = checked;
    this.edgeless.slots.navigatorSettingUpdated.emit({
      blackBackground: this.blackBackground,
    });
  };

  @property({ attribute: false })
  accessor setPopperShow: (show: boolean) => void = () => {};

  override connectedCallback() {
    super.connectedCallback();
    this._tryRestoreSettings();
  }

  override firstUpdated() {
    this._navigatorSettingPopper = createButtonPopper(
      this._navigatorSettingButton,
      this._navigatorSettingMenu,
      ({ display }) => this.setPopperShow(display === 'show'),
      22
    );
  }

  override render() {
    return html`
      <edgeless-tool-icon-button
        class="navigator-setting-button"
        .tooltip=${this.popperShow ? '' : 'Settings'}
        @click=${() => {
          this._navigatorSettingPopper?.toggle();
        }}
        .iconContainerPadding=${0}
      >
        ${NavigatorSettingsIcon}
      </edgeless-tool-icon-button>

      <div
        class="navigator-setting-menu"
        @click=${(e: MouseEvent) => {
          e.stopPropagation();
        }}
      >
        <div class="item-container header">
          <div class="text title">Playback Settings</div>
        </div>

        <div class="item-container">
          <div class="text">Black background</div>

          <toggle-switch
            .on=${this.blackBackground}
            .onChange=${this._onBlackBackgroundChange}
          >
          </toggle-switch>
        </div>

        <div class="item-container">
          <div class="text">Hide toolbar</div>

          <toggle-switch
            .on=${this.hideToolbar}
            .onChange=${(checked: boolean) => {
              this.onHideToolbarChange && this.onHideToolbarChange(checked);
            }}
          >
          </toggle-switch>
        </div>

        ${this.includeFrameOrder
          ? html` <div class="divider"></div>
              <div class="item-container header">
                <div class="text title">Frame Order</div>
              </div>

              <edgeless-frame-order-menu
                .edgeless=${this.edgeless}
                .frames=${this.frames}
                .embed=${true}
              ></edgeless-frame-order-menu>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-navigator-setting-button': EdgelessNavigatorSettingButton;
  }
}
