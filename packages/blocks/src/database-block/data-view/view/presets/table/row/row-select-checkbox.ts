import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import {
  type ReadonlySignal,
  SignalWatcher,
  computed,
} from '@lit-labs/preact-signals';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  checkboxChecked,
  checkboxUnchecked,
} from '../../../../../../list-block/utils/icons.js';
import {
  TableRowSelection,
  type TableViewSelectionWithType,
} from '../types.js';

@customElement('row-select-checkbox')
export class RowSelectCheckbox extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    row-select-checkbox {
      display: contents;
    }
    .row-select-checkbox {
      display: flex;
      align-items: center;
      background-color: var(--affine-background-primary-color);
      opacity: 0;
      cursor: pointer;
    }
    .row-select-checkbox:hover {
      opacity: 1;
    }
    .row-select-checkbox.selected {
      opacity: 1;
    }
    .row-select-checkbox svg {
      width: 18px;
      height: 18px;
      color: var(--affine-icon-color);
    }
  `;

  isSelected$ = computed(() => {
    const selection = this.selection.value;
    if (!selection || selection.selectionType !== 'row') {
      return false;
    }
    return TableRowSelection.includes(selection, {
      id: this.rowId,
      groupKey: this.groupKey,
    });
  });

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', () => {
      this.closest('affine-database-table')?.selectionController.toggleRow(
        this.rowId,
        this.groupKey
      );
    });
  }

  override render() {
    const classString = classMap({
      'row-selected-bg': true,
      'row-select-checkbox': true,
      selected: this.isSelected$.value,
    });
    return html`
      <div class="${classString}">
        ${this.isSelected$.value ? checkboxChecked() : checkboxUnchecked()}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor groupKey: string | undefined;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor selection!: ReadonlySignal<TableViewSelectionWithType | undefined>;
}
