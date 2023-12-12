import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement } from '@blocksuite/lit';
import { autoUpdate, computePosition, size } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { createModal } from '../../../_common/components/menu/index.js';
import { CrossIcon } from '../../../_common/icons/index.js';
import type { DataViewManager } from '../data-view-manager.js';
import { RecordDetail } from './detail.js';

@customElement('side-layout-modal')
class SideLayoutModal extends ShadowlessElement {
  static override styles = css`
    side-layout-modal {
      display: block;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 500px;
      background-color: var(--affine-background-overlay-panel-color);
      border-left: 0.5px solid var(--affine-border-color);
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
      color: var(--affine-icon-color);
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
        <div @click="${this.close}" class="close-modal header-op">
          ${CrossIcon}
        </div>
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
  //FIXME: to make widget path work
  const page =
    document.querySelector('affine-doc-page') ??
    document.querySelector('affine-edgeless-page');
  assertExists(page);
  const block = findFirstBlockParent(page) ?? page;
  const modal = createModal(page);
  // fit to the size of the page element
  const cancel = autoUpdate(block, modal, () => {
    computePosition(block, modal, {
      middleware: [
        size({
          apply: ({ rects }) => {
            Object.assign(modal.style, {
              left: `${rects.reference.x}px`,
              top: `${rects.reference.y}px`,
              width: `${rects.reference.width}px`,
              height: `${rects.reference.height}px`,
            });
          },
        }),
      ],
    });
  });
  const close = () => {
    modal.remove();
    ops.onClose?.();
    cancel();
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
const findFirstBlockParent = (ele: HTMLElement | null) => {
  while (ele && ele.computedStyleMap().get('display')?.toString() !== 'block') {
    ele = ele.parentElement;
  }
  return ele;
};
