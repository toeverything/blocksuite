import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

export class FootNotePopupChip extends LitElement {
  static override styles = css`
    .popup-chip-container {
      display: flex;
      border-radius: 4px;
      max-width: 173px;
      height: 24px;
      padding: 4px;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      cursor: default;
      transition: width 0.3s ease-in-out;
    }

    .prefix-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 16px;
      width: 16px;
      color: ${unsafeCSSVarV2('icon/primary')};
      border-radius: 4px;

      svg,
      img {
        width: 16px;
        height: 16px;
        fill: ${unsafeCSSVarV2('icon/primary')};
      }
    }

    .popup-chip-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
      height: 22px;
      line-height: 22px;
      color: ${unsafeCSSVarV2('text/primary')};
      font-size: var(--affine-font-sm);
      font-weight: 500;
    }
  `;

  override render() {
    return html`
      <div class="popup-chip-container" @click=${this.onClick}>
        ${this.prefixIcon
          ? html`<div class="prefix-icon" @click=${this.onPrefixClick}>
              ${this.prefixIcon}
            </div>`
          : nothing}
        <div class="popup-chip-label" title=${this.tooltip}>${this.label}</div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor prefixIcon: TemplateResult | undefined = undefined;

  @property({ attribute: false })
  accessor label: string = '';

  @property({ attribute: false })
  accessor tooltip: string = '';

  @property({ attribute: false })
  accessor onClick: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor onPrefixClick: (() => void) | undefined = undefined;
}
