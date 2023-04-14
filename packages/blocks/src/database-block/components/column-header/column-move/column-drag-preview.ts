import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ShadowlessElement } from '../../../../__internal__/index.js';

@customElement('affine-database-column-drag-preview')
export class ColumnDragPreview extends ShadowlessElement {
  override render() {
    return html`
      <style>
        affine-database-column-drag-preview {
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 220px;
          width: fit-content;
          border: 1px solid var(--affine-border-color);
          border-radius: 4px;
          overflow: hidden;
          cursor: none;
          user-select: none;
          pointer-events: none;
          caret-color: transparent;
          z-index: 100;
        }

        .preview-column-header {
          opacity: 0.8;
          border-bottom: 1px solid var(--affine-border-color);
          background: var(--affine-tertiary-color);
        }
        .preview-column-header .affine-database-column-move svg {
          opacity: 1;
        }
        .preview-column-header .affine-database-column-move circle {
          fill: var(--affine-text-emphasis-color);
        }

        .preview-column-content {
          flex: 1;
          opacity: 0.8;
          background: var(--affine-white);
        }
      </style>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-column-drag-preview': ColumnDragPreview;
  }
}
