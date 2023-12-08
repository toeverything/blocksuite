import '../../buttons/tool-icon-button.js';
import './frames-setting-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  FILL_SCREEN_KEY,
  type NavigatorMode,
} from '../../../../../_common/edgeless/frame/consts.js';
import {
  SettingsIcon,
  SmallFrameNavigatorIcon,
} from '../../../../../_common/icons/edgeless.js';
import type { EdgelessTool } from '../../../../../_common/utils/types.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createButtonPopper } from '../../utils.js';

const styles = css`
  :host {
    display: flex;
    width: calc(100% - 16px);
    justify-content: center;
  }

  .frame-sidebar-header {
    display: flex;
    width: 284px;
    height: 36px;
    align-items: center;
    justify-content: space-between;
  }

  .all-frames-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100px;
    height: 24px;
    margin: 6px 0;
  }

  .all-frames-setting-button svg {
    color: var(--affine-icon-secondary);
  }

  .all-frames-setting-button:hover svg,
  .all-frames-setting-button.active svg {
    color: var(--affine-icon-color);
  }

  .all-frames-setting-label {
    width: 68px;
    height: 22px;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    color: var(--light-text-color-text-secondary-color, #8e8d91);
  }

  .frames-setting-container {
    display: none;
    justify-content: center;
    align-items: center;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
  }

  .frames-setting-container[data-show] {
    display: flex;
  }

  .presentation-button {
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    width: 117px;
    height: 28px;
    padding: 4px 8px;
    border-radius: 8px;
    margin: 4px;
    border: 1px solid var(--affine-border-color);
    background: var(--affine-white);
  }

  .presentation-button:hover {
    background: var(--affine-hover-color);
    cursor: pointer;
  }

  .presentation-button svg {
    fill: var(--affine-icon-color);
    margin-right: 4px;
  }

  .presentation-button-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
  }
`;

export class FrameSidebarHeader extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _settingPopperShow = false;

  @query('.all-frames-setting-button')
  private _frameSettingButton!: HTMLDivElement;

  @query('.frames-setting-container')
  private _frameSettingMenu!: HTMLDivElement;

  private _framesSettingMenuPopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

  private _navigatorMode: NavigatorMode = 'fit';

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  private _enterPresentationMode = () => {
    this.setEdgelessTool({ type: 'frameNavigator', mode: this._navigatorMode });
  };

  private _tryLoadNavigatorStateLocalRecord() {
    this._navigatorMode =
      sessionStorage.getItem(FILL_SCREEN_KEY) === 'true' ? 'fill' : 'fit';
  }

  override firstUpdated() {
    const _disposables = this._disposables;

    this._framesSettingMenuPopper = createButtonPopper(
      this._frameSettingButton,
      this._frameSettingMenu,
      ({ display }) => {
        this._settingPopperShow = display === 'show';
      },
      14,
      -120
    );
    _disposables.add(this._framesSettingMenuPopper);

    _disposables.add(
      this.edgeless.slots.navigatorSettingUpdated.on(({ fillScreen }) => {
        this._navigatorMode = fillScreen ? 'fill' : 'fit';
      })
    );

    this._tryLoadNavigatorStateLocalRecord();
  }

  override render() {
    return html`<div class="frame-sidebar-header">
      <div class="all-frames-setting">
        <span class="all-frames-setting-label">All frames</span>
        <edgeless-tool-icon-button
          class="all-frames-setting-button ${this._settingPopperShow
            ? 'active'
            : ''}"
          .tooltip=${this._settingPopperShow ? '' : 'All Frames Settings'}
          .tipPosition=${'top'}
          .iconContainerPadding=${2}
          .active=${this._settingPopperShow}
          .activeMode=${'background'}
          @click=${() => this._framesSettingMenuPopper?.toggle()}
        >
          ${SettingsIcon}
        </edgeless-tool-icon-button>
      </div>
      <div class="frames-setting-container">
        <frames-setting-menu .edgeless=${this.edgeless}></frames-setting-menu>
      </div>
      <div class="presentation-button" @click=${this._enterPresentationMode}>
        ${SmallFrameNavigatorIcon}<span class="presentation-button-label"
          >Presentation</span
        >
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-sidebar-header': FrameSidebarHeader;
  }
}
