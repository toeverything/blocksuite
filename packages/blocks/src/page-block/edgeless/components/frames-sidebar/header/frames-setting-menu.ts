import '../../../../../_common/components/menu-divider.js';
import '../../../../../_common/components/toggle-switch.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import { BLACK_BACKGROUND_KEY } from '../../../../../_common/edgeless/frame/consts.js';
import { stopPropagation } from '../../../../../_common/utils/event.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
    padding: 8px;
    width: 290px;
  }

  .frames-setting-menu-container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
  }

  .frames-setting-menu-item {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 28px;
    padding: 4px 12px;
    align-items: center;
  }

  .frames-setting-menu-item .setting-label {
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    padding: 0 4px;
  }

  .frames-setting-menu-divider {
    width: 100%;
    height: 1px;
    box-sizing: border-box;
    background: var(--affine-border-color);
    margin: 8px 0;
  }

  .frames-setting-menu-item.action {
    gap: 4px;
  }

  .frames-setting-menu-item .action-label {
    width: 204px;
    height: 20px;
    padding: 0 4px;
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-primary-color);
  }

  .frames-setting-menu-item .toggle-button {
    display: flex;
  }

  menu-divider {
    height: 16px;
  }
`;

export class FramesSettingMenu extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  blackBackground = false;

  private _tryRestoreSettings() {
    const blackBackground = sessionStorage.getItem(BLACK_BACKGROUND_KEY);
    this.blackBackground = blackBackground !== 'false';
  }

  private _onBlackBackgroundChange = (checked: boolean) => {
    this.blackBackground = !checked;
    this.edgeless.slots.navigatorSettingUpdated.emit({
      blackBackground: this.blackBackground,
    });
    console.log('sidebar');
  };

  override connectedCallback() {
    super.connectedCallback();
    this._tryRestoreSettings();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log('disconnectedCallback');
  }

  override firstUpdated() {
    this.disposables.add(
      this.edgeless.slots.navigatorSettingUpdated.on(({ blackBackground }) => {
        if (
          blackBackground !== undefined &&
          blackBackground !== this.blackBackground
        ) {
          this.blackBackground = blackBackground;
        }
      })
    );
  }

  override render() {
    return html`<div
      class="frames-setting-menu-container"
      @click=${stopPropagation}
    >
      <div class="frames-setting-menu-item">
        <div class="setting-label">Preview Settings</div>
      </div>
      <div class="frames-setting-menu-item action">
        <div class="action-label">Fill Screen</div>
        <div class="toggle-button"><toggle-switch></toggle-switch></div>
      </div>

      <menu-divider></menu-divider>

      <div class="frames-setting-menu-item">
        <div class="setting-label">Playback Settings</div>
      </div>
      <div class="frames-setting-menu-item action">
        <div class="action-label">Hide toolbar while presenting</div>
        <div class="toggle-button"><toggle-switch></toggle-switch></div>
      </div>
      <div class="frames-setting-menu-item action">
        <div class="action-label">Hide background while presenting</div>
        <div class="toggle-button">
          <toggle-switch
            .on=${!this.blackBackground}
            .onChange=${this._onBlackBackgroundChange}
          ></toggle-switch>
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frames-setting-menu': FramesSettingMenu;
  }
}
