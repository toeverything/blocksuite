import './field.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { DataViewManager } from '../data-view-manager.js';

const styles = css`
  affine-data-view-record-detail {
    display: flex;
    flex-direction: column;
    padding: 0 36px;
    gap: 12px;
  }
`;

@customElement('affine-data-view-record-detail')
export class RecordDetail extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewManager;
  @property({ attribute: false })
  rowId!: string;

  override render() {
    const columns = this.view.columnsWithoutFilter;

    return html` ${repeat(
      columns,
      v => v,
      id => {
        const column = this.view.columnGet(id);
        return html` <affine-data-view-record-field
          .view="${this.view}"
          .column="${column}"
          .rowId="${this.rowId}"
        ></affine-data-view-record-field>`;
      }
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-detail': RecordDetail;
  }
}
