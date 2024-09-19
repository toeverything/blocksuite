import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { SmallCloseIcon, SortingIcon } from '../../_common/icons.js';

const styles = css`
  :host {
    width: 100%;
    box-sizing: border-box;
    position: absolute;
    left: 0;
    bottom: 8px;
    padding: 0 8px;
  }
  .outline-notice-container {
    display: flex;
    width: 100%;
    box-sizing: border-box;
    gap: 14px;
    padding: 10px;
    font-style: normal;
    font-size: 12px;
    flex-direction: column;
    border-radius: 8px;
    background-color: var(--affine-background-overlay-panel-color);
  }
  .outline-notice-header {
    display: flex;
    width: 100%;
    height: 20px;
    align-items: center;
    justify-content: space-between;
  }
  .outline-notice-label {
    font-weight: 600;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
  }
  .outline-notice-close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: var(--affine-icon-color);
  }
  .outline-notice-body {
    display: flex;
    width: 100%;
    gap: 2px;
    flex-direction: column;
  }
  .outline-notice-item {
    display: flex;
    height: 20px;
    align-items: center;
    line-height: 20px;
    color: var(--affine-text-primary-color);
  }
  .outline-notice-item.notice {
    font-weight: 400;
  }
  .outline-notice-item.button {
    display: flex;
    gap: 2px;
    font-weight: 500;
    text-decoration: underline;
    cursor: pointer;
  }
  .outline-notice-item.button span {
    display: flex;
    align-items: center;
    line-height: 20px;
  }
  .outline-notice-item.button svg {
    scale: 0.8;
  }
`;

export const AFFINE_OUTLINE_NOTICE = 'affine-outline-notice';

export class OutlineNotice extends WithDisposable(LitElement) {
  static override styles = styles;

  private _handleNoticeButtonClick() {
    this.toggleNotesSorting();
    this.setNoticeVisibility(false);
  }

  override render() {
    if (!this.noticeVisible) {
      return nothing;
    }

    return html`<div class="outline-notice-container">
      <div class="outline-notice-header">
        <span class="outline-notice-label">SOME CONTENTS HIDDEN</span>
        <span
          class="outline-notice-close-button"
          @click=${() => this.setNoticeVisibility(false)}
          >${SmallCloseIcon}</span
        >
      </div>
      <div class="outline-notice-body">
        <div class="outline-notice-item notice">
          Some contents are not visible on edgeless.
        </div>
        <div
          class="outline-notice-item button"
          @click=${this._handleNoticeButtonClick}
        >
          <span>Click here or</span>
          <span>${SortingIcon}</span>
          <span>to organize content.</span>
        </div>
      </div>
    </div>`;
  }

  @property({ attribute: false })
  accessor noticeVisible!: boolean;

  @property({ attribute: false })
  accessor setNoticeVisibility!: (visibility: boolean) => void;

  @property({ attribute: false })
  accessor toggleNotesSorting!: () => void;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_NOTICE]: OutlineNotice;
  }
}
