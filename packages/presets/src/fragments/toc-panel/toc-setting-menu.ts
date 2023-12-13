import { stopPropagation } from '@blocksuite/blocks';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
    padding: 8px;
    width: 220px;
  }

  .notes-setting-menu-container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
  }

  .notes-setting-menu-item {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 28px;
    padding: 4px 12px;
    align-items: center;
  }

  .notes-setting-menu-item .setting-label {
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    padding: 0 4px;
  }

  .notes-setting-menu-item.action {
    gap: 4px;
  }

  .notes-setting-menu-item .action-label {
    width: 138px;
    height: 20px;
    padding: 0 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-primary-color);
  }

  .notes-setting-menu-item .toggle-button {
    display: flex;
  }
`;

export class TOCNotesSettingMenu extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  hideIcon = false;

  @property({ attribute: false })
  toggleHideIcon!: (on: boolean) => void;

  override render() {
    return html`<div
      class="notes-setting-menu-container"
      @click=${stopPropagation}
    >
      <div class="notes-setting-menu-item">
        <div class="setting-label">Settings</div>
      </div>
      <div class="notes-setting-menu-item action">
        <div class="action-label">Hide type icon</div>
        <div class="toggle-button">
          <toggle-switch
            .on=${this.hideIcon}
            .onChange=${this.toggleHideIcon}
          ></toggle-switch>
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toc-notes-setting-menu': TOCNotesSettingMenu;
  }
}
