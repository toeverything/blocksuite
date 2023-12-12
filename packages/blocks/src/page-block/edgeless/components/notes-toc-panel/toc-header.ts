import './toc-setting-menu.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { SettingsIcon } from '../../../../_common/icons/edgeless.js';
import { createButtonPopper } from '../utils.js';

const styles = css`
  :host {
    display: flex;
    width: calc(100% - 16px);
    height: 40px;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 8px 0;
  }

  .toc-notes-header-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 100%;
  }

  .toc-notes-header-label {
    width: 119px;
    height: 22px;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    color: var(--light-text-color-text-secondary-color, #8e8d91);
  }

  .notes-setting-button svg {
    color: var(--affine-icon-secondary);
  }

  .notes-setting-button:hover svg,
  .notes-setting-button.active svg {
    color: var(--affine-icon-color);
  }

  .notes-setting-container {
    display: none;
    justify-content: center;
    align-items: center;
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-shadow-2);
    border-radius: 8px;
  }

  .notes-setting-container[data-show] {
    display: flex;
  }
`;

export class TOCNotesHeader extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  hidePreviewIcon!: boolean;

  @property({ attribute: false })
  toggleHidePreviewIcon!: (on: boolean) => void;

  @state()
  private _settingPopperShow = false;

  @query('.notes-setting-button')
  private _notesSettingButton!: HTMLDivElement;

  @query('.notes-setting-container')
  private _notesSettingMenu!: HTMLDivElement;

  private _notesSettingMenuPopper: ReturnType<
    typeof createButtonPopper
  > | null = null;

  override firstUpdated() {
    const _disposables = this._disposables;

    this._notesSettingMenuPopper = createButtonPopper(
      this._notesSettingButton,
      this._notesSettingMenu,
      ({ display }) => {
        this._settingPopperShow = display === 'show';
      },
      14,
      -90
    );
    _disposables.add(this._notesSettingMenuPopper);
  }

  override render() {
    return html`<div class="toc-notes-header-container">
        <span class="toc-notes-header-label">Table of Contents</span>
        <edgeless-tool-icon-button
          class="notes-setting-button ${this._settingPopperShow
            ? 'active'
            : ''}"
          .tooltip=${this._settingPopperShow ? '' : 'Settings'}
          .tipPosition=${'top'}
          .iconContainerPadding=${2}
          .active=${this._settingPopperShow}
          .activeMode=${'background'}
          @click=${() => this._notesSettingMenuPopper?.toggle()}
        >
          ${SettingsIcon}
        </edgeless-tool-icon-button>
      </div>
      <div class="notes-setting-container">
        <edgeless-toc-notes-setting-menu
          .hideIcon=${this.hidePreviewIcon}
          .toggleHideIcon=${this.toggleHidePreviewIcon}
        ></edgeless-toc-notes-setting-menu>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toc-notes-header': TOCNotesHeader;
  }
}
