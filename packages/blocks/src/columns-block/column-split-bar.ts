import { ShadowlessElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

const AddColumnIcon = html`<svg
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M6 12H18M12 6V18"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg> `;

export const SPLIT_BAR_WIDTH = 16;

const TOP_OFFSET = 12;

@customElement('affine-columns-split-bar')
export class ColumnsSplitBar extends ShadowlessElement {
  static override styles = css`
    .affine-block-columns-split-bar {
      width: ${SPLIT_BAR_WIDTH};
      height: calc(100% + ${TOP_OFFSET}px);
      margin-top: -${TOP_OFFSET}px;
      position: relative;
      cursor: col-resize;
      &::before {
        content: '';
        position: absolute;
        top: ${TOP_OFFSET + 4}px;
        left: calc(50% - 2px);
        width: 4px;
        height: calc(100% - 8px - ${TOP_OFFSET}px);
        border-radius: 2px;
        transition: background-color 0.2s;
      }

      &:hover,
      &[data-dragging] {
        &::before {
          background-color: var(--affine-primary-color);
        }
      }

      .affine-block-columns-add-column {
        opacity: 0;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--affine-background-secondary-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition:
          background-color 0.2s,
          color 0.2s;

        &:hover {
          background-color: var(--affine-primary-color);
          color: #fff;
        }
      }

      &:hover {
        .affine-block-columns-add-column {
          opacity: 1;
        }
      }

      .affine-block-columns-add-column-placeholder {
        position: absolute;
        opacity: 1;
        top: 0px;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--affine-primary-color);
        border-radius: 3px;
        width: 6px;
        height: 6px;
      }

      &:hover {
        .affine-block-columns-add-column-placeholder {
          opacity: 0;
          pointer-events: none;
        }
      }
    }
  `;

  override render() {
    return html`<div class="affine-block-columns-split-bar">
      <div
        class="affine-block-columns-add-column"
        @click=${() => this.dispatchEvent(new CustomEvent('add-column'))}
      >
        ${AddColumnIcon}
      </div>
      <div class="affine-block-columns-add-column-placeholder"></div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-columns-split-bar': ColumnsSplitBar;
  }
}
