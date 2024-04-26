import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../../column/index.js';
import { renderUniLit } from '../../../../utils/uni-component/index.js';
import type { DataViewManager } from '../../../data-view-manager.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-database-cell-container {
      position: relative;
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    affine-database-cell-container * {
      box-sizing: border-box;
    }

    affine-database-cell-container uni-lit > *:first-child {
      padding: 8px;
    }
    .drag-and-fill-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color);
      background-color: var(--affine-background-overlay-panel-color);
      transform: translate(50%, 50%);
      pointer-events: auto;
      cursor: ns-resize;
      right: 0;
      bottom: 0;
      z-index: 2;
      user-select: none;
      display: none;
    }
    .drag-and-fill-handle.active {
      display: block;
    }
  `;

  @state()
  public isEditing = false;

  @property({ attribute: false })
  public readonly view!: DataViewManager;
  @property({ attribute: false })
  public readonly rowId!: string;
  @property({ attribute: false })
  public readonly rowIndex!: number;
  @property({ attribute: false })
  public readonly columnId!: string;
  @property({ attribute: false })
  public readonly columnIndex!: number;

  @property({ attribute: false })
  column!: DataViewTableColumnManager;

  private get selectionView() {
    return this.closest('affine-database-table')?.selectionController;
  }

  private get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  public selectCurrentCell = (editing: boolean) => {
    if (this.selectionView) {
      this.selectionView.selection = {
        groupKey: this.groupKey,
        focus: {
          rowIndex: this.rowIndex,
          columnIndex: this.columnIndex,
        },
        isEditing: editing,
      };
    }
  };

  public showDragToFillHandle = () => {
    const selection = this.selectionView?.selection;
    return (
      selection &&
      !selection.isEditing &&
      selection.focus.columnIndex === this.columnIndex &&
      selection.focus.rowIndex === this.rowIndex
    );
  };

  private get readonly() {
    return this.column.readonly;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  private _cell = createRef<DataViewCellLifeCycle>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly);
      }
    });
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const { edit, view } = this.column.renderer;

    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    const props: CellRenderProps = {
      view: this.view,
      column: this.column,
      rowId: this.rowId,
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };
    return html`
      ${renderUniLit(uni, props, {
        ref: this._cell,
        style: {
          display: 'contents',
        },
      })}

      <div
        class="drag-and-fill-handle ${this.showDragToFillHandle()
          ? 'active'
          : ''}"
        data-drag-fill-handle="true"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
