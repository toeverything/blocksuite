import '../../buttons/tool-icon-button.js';
import './frames-setting-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  SettingsIcon,
  SmallFrameNavigatorIcon,
} from '../../../../../_common/icons/edgeless.js';
import type { EdgelessTool } from '../../../../../_common/utils/types.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { createButtonPopper } from '../../utils.js';

const styles = css`
  .frames-sidebar-header {
    display: flex;
    width: 284px;
    height: 36px;
    align-items: center;
    justify-content: space-between;
    font-family: sans-serif;
  }

  .all-frames-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100px;
    height: 24px;
    margin: 6px 0;
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

export class FramesSidebarHeader extends WithDisposable(LitElement) {
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

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  private _enterPresentationMode = () => {
    this.setEdgelessTool({ type: 'frameNavigator' });
  };

  override firstUpdated() {
    const _disposables = this._disposables;

    this._framesSettingMenuPopper = createButtonPopper(
      this._frameSettingButton,
      this._frameSettingMenu,
      ({ display }) => {
        this._settingPopperShow = display === 'show';
      }
    );
    _disposables.add(this._framesSettingMenuPopper);
  }

  override render() {
    return html`<div class="frames-sidebar-header">
      <div class="all-frames-setting">
        <span class="all-frames-setting-label">All frames</span>
        <edgeless-tool-icon-button
          class="all-frames-setting-button"
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
        <frames-setting-menu></frames-setting-menu>
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
    'frames-sidebar-header': FramesSidebarHeader;
  }
}
