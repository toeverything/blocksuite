import './frame-order-menu.js';
import '../../buttons/tool-icon-button.js';
import '../../../../../_common/components/toggle-switch.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { EdgelessPresentationConsts as PresentationConsts } from '../../../../../_common/edgeless/frame/consts.js';
import { NavigatorSettingsIcon } from '../../../../../_common/icons/edgeless.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createButtonPopper } from '../../utils.js';

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
      display: initial;
    }

    .item-container {
      padding: 0px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 28px;
      width: 204px;
    }

    .text {
      padding: 0px 4px;
    }

    .title {
      color: var(--affine-text-secondary-color);
    }
  `;

  @state()
  blackBackground = true;

  @property({ attribute: false })
  popperShow = false;

  @property({ attribute: false })
  setPopperShow: (show: boolean) => void = () => {};

  @property({ attribute: false })
  hideToolbar = false;

  @property({ attribute: false })
  onHideToolbarChange?: (hideToolbar: boolean) => void;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @query('.navigator-setting-button')
  private _navigatorSettingButton!: HTMLElement;
  @query('.navigator-setting-menu')
  private _navigatorSettingMenu!: HTMLElement;
  private _navigatorSettingPopper?: ReturnType<
    typeof createButtonPopper
  > | null = null;

  private _tryRestoreSettings() {
    const blackBackground = sessionStorage.getItem(
      PresentationConsts.BlackBackground
    );
    this.blackBackground = blackBackground !== 'false';
  }

  private _onBlackBackgroundChange = (checked: boolean) => {
    this.blackBackground = checked;
    this.edgeless.slots.navigatorSettingUpdated.emit({
      blackBackground: this.blackBackground,
    });
  };

  override connectedCallback() {
    super.connectedCallback();
    this._tryRestoreSettings();
  }

  override firstUpdated() {
    this._navigatorSettingPopper = createButtonPopper(
      this._navigatorSettingButton,
      this._navigatorSettingMenu,
      ({ display }) => this.setPopperShow(display === 'show')
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
      >
        ${NavigatorSettingsIcon}
      </edgeless-tool-icon-button>
      <div
        class="navigator-setting-menu"
        @click=${(e: MouseEvent) => {
          e.stopPropagation();
        }}
      >
        <div class="item-container">
          <div class="text title">Playback Settings</div>
        </div>
        <div class="item-container">
          <div class="text">Dark background</div>
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
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-navigator-setting-button': EdgelessNavigatorSettingButton;
  }
}
