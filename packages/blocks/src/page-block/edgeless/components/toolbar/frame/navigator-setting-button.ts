import './frame-order-menu.js';
import '../../buttons/tool-icon-button.js';
import '../../../../../_common/components/toggle-switch.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { NavigatorSettingsIcon } from '../../../../../_common/icons/edgeless.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createButtonPopper } from '../../utils.js';

const blackBackgroundKey = 'blocksuite:' + 'presentation' + ':blackBackground';

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
      width: 254px;
    }

    .text {
      padding: 0px 4px;
    }

    .title {
      color: var(--affine-text-secondary-color);
    }
  `;

  @state()
  private _popperShow = false;

  @state()
  blackBackground = true;

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

  override firstUpdated() {
    this._navigatorSettingPopper = createButtonPopper(
      this._navigatorSettingButton,
      this._navigatorSettingMenu,
      ({ display }) => (this._popperShow = display === 'show')
    );

    this._tryRestoreSettings();
  }

  private _tryRestoreSettings() {
    const blackBackground = sessionStorage.getItem(blackBackgroundKey);
    this.blackBackground = blackBackground !== 'false';
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('blackBackground')) {
      this.edgeless.slots.navigatorSettingUpdated.emit({
        blackBackground: this.blackBackground,
      });
      sessionStorage.setItem(
        blackBackgroundKey,
        this.blackBackground.toString()
      );
    }
  }

  override render() {
    return html`
      <edgeless-tool-icon-button
        class="navigator-setting-button"
        .tooltip=${this._popperShow ? '' : 'Settings'}
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
          <div class="text title">Settings</div>
        </div>
        <div class="item-container">
          <div class="text">Hide toolbar while presenting</div>
          <toggle-switch
            .on=${this.hideToolbar}
            .onChange=${(checked: boolean) => {
              this.onHideToolbarChange && this.onHideToolbarChange(checked);
              if (checked) {
                this._navigatorSettingPopper?.hide();
              }
            }}
          >
          </toggle-switch>
        </div>
        <div class="item-container">
          <div class="text">Hide background while presenting</div>
          <toggle-switch
            .on=${!this.blackBackground}
            .onChange=${(checked: boolean) => {
              this.blackBackground = !checked;
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
