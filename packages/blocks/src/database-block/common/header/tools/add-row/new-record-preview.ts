import { ShadowlessElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { PlusIcon } from '../../../../../_common/icons/index.js';

@customElement('affine-database-new-record-preview')
export class NewRecordPreview extends ShadowlessElement {
  override render() {
    return html`
      <style>
        affine-database-new-record-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          height: 32px;
          width: 32px;
          border: 1px solid var(--affine-border-color);
          border-radius: 50%;
          background: var(--affine-blue-100);
          box-shadow:
            0px 0px 10px rgba(0, 0, 0, 0.05),
            0px 0px 0px 0.5px var(--affine-black-10);
          cursor: none;
          user-select: none;
          pointer-events: none;
          caret-color: transparent;
          z-index: 99999;
        }

        affine-database-new-record-preview svg {
          width: 16px;
          height: 16px;
        }

        affine-database-new-record-preview path {
          fill: var(--affine-brand-color);
        }
      </style>
      ${PlusIcon}
    `;
  }
}
