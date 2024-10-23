/// <reference types="vite/client" />

import type { RowBlockModel } from '@blocksuite/affine-model';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { TableSingleView } from '../microsheet-block/data-view/view/presets/table/table-view-manager.js';
import type { RowBlockService } from './row-service.js';

export class RowBlockComponent extends CaptionedBlockComponent<
  RowBlockModel,
  RowBlockService
> {
  static override styles = css`
    affine-row > .database-cell {
      padding: 10px;
    }
    affine-row {
      border-right: 1px solid var(--affine-border-color);
      // border-left: 1px solid var(--affine-border-color);
      // border-top: 1px solid var(--affine-border-color);
    }
    .affine-row-block-container {
      display: flow-root;
    }
    .affine-row-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  override renderBlock() {
    const { view, rowId, rowIndex, std } = this;
    return html`<microsheet-data-view-table-row
      data-row-index="${rowIndex}"
      data-row-id="${rowId}"
      .view="${view}"
      .rowId="${rowId}"
      .rowIndex="${rowIndex}"
      .std="${std}"
    ></microsheet-data-view-table-row>`;
  }

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-row': RowBlockComponent;
  }
}
