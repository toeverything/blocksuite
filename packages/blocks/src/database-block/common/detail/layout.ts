import { ShadowlessElement } from '@blocksuite/lit';
import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createModal } from '../../../components/menu/index.js';
import type { DataViewManager } from '../data-view-manager.js';
import { RecordDetail } from './detail.js';

const close = svg`<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
  <path fill-rule='evenodd' clip-rule='evenodd' d='M4.55806 4.55806C4.80214 4.31398 5.19786 4.31398 5.44194 4.55806L10 9.11612L14.5581 4.55806C14.8021 4.31398 15.1979 4.31398 15.4419 4.55806C15.686 4.80214 15.686 5.19786 15.4419 5.44194L10.8839 10L15.4419 14.5581C15.686 14.8021 15.686 15.1979 15.4419 15.4419C15.1979 15.686 14.8021 15.686 14.5581 15.4419L10 10.8839L5.44194 15.4419C5.19786 15.686 4.80214 15.686 4.55806 15.4419C4.31398 15.1979 4.31398 14.8021 4.55806 14.5581L9.11612 10L4.55806 5.44194C4.31398 5.19786 4.31398 4.80214 4.55806 4.55806Z' fill='#77757D'/>
</svg>
`;
// const arrowUp = svg`<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
// <path fill-rule='evenodd' clip-rule='evenodd' d='M14.5894 9.16404C14.3351 9.39752 13.9398 9.3807 13.7063 9.12646L10.625 5.77123L10.625 15.8333C10.625 16.1785 10.3451 16.4583 9.99996 16.4583C9.65478 16.4583 9.37496 16.1785 9.37496 15.8333L9.37496 5.77123L6.29362 9.12646C6.06014 9.3807 5.66477 9.39752 5.41054 9.16404C5.1563 8.93056 5.13948 8.53519 5.37296 8.28096L9.53962 3.74392C9.65799 3.61503 9.82496 3.54167 9.99996 3.54167C10.1749 3.54167 10.3419 3.61503 10.4603 3.74392L14.627 8.28096C14.8604 8.53519 14.8436 8.93056 14.5894 9.16404Z' fill='#77757D'/>
// </svg>
// `;

@customElement('side-layout-modal')
class SideLayoutModal extends ShadowlessElement {
  static override styles = css`
    side-layout-modal {
      display: block;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 450px;
      background-color: var(--affine-background-primary-color);
      border-left: 0.5px solid var(--affine-divider-color, #e3e2e4);
      box-shadow: -5px 0px 10px 0px rgba(0, 0, 0, 0.05);
    }

    .side-modal-header {
      margin: 12px 0;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: end;
    }

    .header-ops {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-op {
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: 4px;
      cursor: pointer;
    }

    .header-op svg {
      width: 20px;
      height: 20px;
      fill: var(--affine-icon-color);
    }

    .header-op:hover {
      background-color: var(--affine-hover-color);
    }

    .close-modal {
      margin-left: 20px;
    }
  `;
  @property({ attribute: false })
  content?: HTMLElement;
  @property({ attribute: false })
  close?: () => void;

  renderOps() {
    return html``;
    // return html`
    //   <div class='header-op' style='transform: rotate(180deg)'>
    //     ${arrowUp}
    //   </div>
    //   <div class='header-op'>${arrowUp}</div>`;
  }

  override render() {
    return html`
      <div class="side-modal-header">
        <div class="header-ops">${this.renderOps()}</div>
        <div @click="${this.close}" class="close-modal header-op">${close}</div>
      </div>
      ${this.content}
    `;
  }
}

export const popSideDetail = (ops: {
  view: DataViewManager;
  rowId: string;
  onClose?: () => void;
}) => {
  const modal = createModal();
  const close = () => {
    modal.remove();
    ops.onClose?.();
  };
  const detail = new RecordDetail();
  detail.view = ops.view;
  detail.rowId = ops.rowId;
  const sideContainer = new SideLayoutModal();
  sideContainer.content = detail;
  sideContainer.close = close;
  sideContainer.onclick = e => {
    e.stopPropagation();
  };
  modal.onclick = close;
  modal.append(sideContainer);
};
