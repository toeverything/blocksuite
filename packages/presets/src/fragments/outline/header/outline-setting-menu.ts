import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
    padding: 8px;
    width: 220px;
  }

  .note-preview-setting-menu-container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
  }

  .note-preview-setting-menu-item {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 28px;
    padding: 4px 12px;
    align-items: center;
  }

  .note-preview-setting-menu-item .setting-label {
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    padding: 0 4px;
  }

  .note-preview-setting-menu-item.action {
    gap: 4px;
  }

  .note-preview-setting-menu-item .action-label {
    width: 138px;
    height: 20px;
    padding: 0 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: var(--affine-text-primary-color);
  }

  .note-preview-setting-menu-item .toggle-button {
    display: flex;
  }
`;

export const AFFINE_OUTLINE_NOTE_PREVIEW_SETTING_MENU =
  'affine-outline-note-preview-setting-menu';

export class OutlineNotePreviewSettingMenu extends WithDisposable(LitElement) {
  static override styles = styles;

  override render() {
    return html`<div
      class="note-preview-setting-menu-container"
      @click=${(e: MouseEvent) => e.stopPropagation()}
    >
      <div class="note-preview-setting-menu-item">
        <div class="setting-label">Settings</div>
      </div>
      <div class="note-preview-setting-menu-item action">
        <div class="action-label">Show type icon</div>
        <div class="toggle-button">
          <toggle-switch
            .on=${this.showPreviewIcon}
            .onChange=${this.toggleShowPreviewIcon}
          ></toggle-switch>
        </div>
      </div>
    </div>`;
  }

  @property({ attribute: false })
  accessor showPreviewIcon!: boolean;

  @property({ attribute: false })
  accessor toggleShowPreviewIcon!: (on: boolean) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_NOTE_PREVIEW_SETTING_MENU]: OutlineNotePreviewSettingMenu;
  }
}
