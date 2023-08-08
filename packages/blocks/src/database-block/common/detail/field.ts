import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { UniLit } from '../../../components/uni-component/uni-component.js';
import type { DataViewCellLifeCycle } from '../columns/manager.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../data-view-manager.js';

const styles = css`
  affine-data-view-record-field {
    display: flex;
    gap: 12px;
  }

  .field-left {
    padding: 2px 4px;
    height: 24px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
    width: 102px;
  }

  affine-data-view-record-field .icon {
    display: flex;
    align-items: center;
    width: 16px;
    height: 16px;
  }

  affine-data-view-record-field .icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }

  .filed-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-content {
    padding: 2px 4px;
    border-radius: 4px;
    flex: 1;
    cursor: pointer;
  }

  .field-content:hover {
    background-color: var(--affine-hover-color);
  }
`;

@customElement('affine-data-view-record-field')
export class RecordField extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewManager;
  @property({ attribute: false })
  column!: DataViewColumnManager;
  @property({ attribute: false })
  rowId!: string;

  @state()
  editing = false;
  private _cell = createRef<UniLit<DataViewCellLifeCycle>>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value?.expose;
  }

  override render() {
    const column = this.column;

    const props = {
      column: this.column,
      rowId: this.rowId,
      isEditing: this.editing,
      selectCurrentCell: (editing: boolean) => {
        this.editing = editing;
      },
    };
    const { view, edit } = this.column.renderer;
    return html`
      <div class="field-left">
        <div class="icon">
          <uni-lit .uni="${this.column.icon}"></uni-lit>
        </div>
        <div class="filed-name">${column.name}</div>
      </div>
      <div class="field-content">
        <uni-lit
          ${ref(this._cell)}
          class="kanban-cell"
          .uni="${this.editing && edit ? edit : view}"
          .props="${props}"
        ></uni-lit>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-record-field': RecordField;
  }
}
