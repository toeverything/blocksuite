import type { RichText } from '@blocksuite/affine-components/rich-text';

import { type BlockStdScope, ShadowlessElement } from '@blocksuite/block-std';
import {
  assertExists,
  noop,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type { DataViewCellLifeCycle } from '../../core/property/index.js';
import type { SingleView } from '../../core/view-manager/single-view.js';
import type { TableGroup } from './group.js';
import type { TableColumn } from './table-view-manager.js';
import type { TableViewSelectionWithType } from './types.js';

export class MicrosheetCellContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-microsheet-cell-container {
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      padding: 2px 8px;
    }

    affine-microsheet-cell-container * {
      box-sizing: border-box;
    }

    affine-microsheet-cell-container microsheet-uni-lit > *:first-child {
      padding: 8px;
    }
  `;

  private _cell = createRef<DataViewCellLifeCycle>();

  @property({ attribute: false })
  accessor column!: TableColumn;

  @property({ attribute: false })
  accessor rowId!: string;

  cell$ = computed(() => {
    return this.column.cellGet(this.rowId);
  });

  selectCurrentCell = (focusTo?: 'start' | 'end') => {
    if (this.view.readonly$.value) {
      return;
    }
    const selectionView = this.selectionView;
    if (selectionView) {
      if (selectionView) {
        this.selectionView.focus = {
          rowIndex: this.rowIndex,
          columnIndex: this.columnIndex,
        };
      }

      assertExists(this.refModel);

      const focus = () => {
        if (focusTo && this.std) {
          const richTexts = this.querySelectorAll('rich-text');

          if (richTexts.length) {
            if (focusTo === 'start') {
              (richTexts[0] as RichText).inlineEditor?.focusStart();
            } else {
              richTexts[richTexts.length - 1].inlineEditor?.focusEnd();
            }
          }
        }
      };

      if (this.refModel.children.length === 0) {
        this.std.doc.addBlock(
          'affine:paragraph',
          {
            text: new this.std.doc.Text(),
          },
          this.refModel
        );
        void this.updateComplete
          .then(() => {
            focus();
          })
          .catch(noop);
      } else {
        focus();
      }
    }
  };

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  private get groupKey() {
    return (
      this.closest('affine-microsheet-data-view-table-group') as TableGroup
    )?.group?.key;
  }

  get refModel() {
    const refId = this.view.cellRefGet(this.rowId, this.column.id);
    if (!refId) return;
    return this.std.doc.getBlockById(refId as string);
  }

  private get selectionView() {
    return this.closest('affine-microsheet-table')?.selectionController;
  }

  get table() {
    const table = this.closest('affine-microsheet-table');
    assertExists(table);
    return table;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', (e: UIEvent) => {
      if (!this.isEditing) {
        if (
          e.target &&
          e.target instanceof HTMLElement &&
          e.target.tagName === 'AFFINE-MICROSHEET-CELL-CONTAINER'
        ) {
          this.selectCurrentCell('end');
        } else {
          this.selectCurrentCell();
        }
        // this.selectCurrentCell();
      }
    });
  }

  isSelected(selection: TableViewSelectionWithType) {
    if (selection.selectionType !== 'area') {
      return false;
    }
    if (selection.groupKey !== this.groupKey) {
      return;
    }
    if (selection.focus.columnIndex !== this.columnIndex) {
      return;
    }
    return selection.focus.rowIndex === this.rowIndex;
  }

  override render() {
    if (!this.std) return nothing;

    assertExists(this.refModel);
    return html`<affine-cell data-block-id=${this.refModel.id}></affine-cell>`;
  }

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-microsheet-cell-container': MicrosheetCellContainer;
  }
}
