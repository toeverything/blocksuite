import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { property } from 'lit/decorators.js';

import type {
  DataViewColumnManager,
  DataViewManager,
} from '../view/data-view-manager.js';
import type { CellRenderProps, DataViewCellLifeCycle } from './manager.js';

export abstract class BaseCellRenderer<
    Value,
    Data extends Record<string, unknown> = Record<string, unknown>,
  >
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewCellLifeCycle, CellRenderProps<Data, Value>
{
  beforeEnterEditMode(): boolean {
    return true;
  }

  blurCell() {
    return true;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.style.width = '100%';
    this._disposables.addFromEvent(this, 'click', e => {
      if (this.isEditing) {
        e.stopPropagation();
      }
    });
    const type = this.column.type;
    this._disposables.add(
      this.column.onCellUpdate(this.rowId, () => {
        if (this.column.type === type) {
          this.requestUpdate();
        }
      })
    );

    this._disposables.addFromEvent(this, 'copy', e => {
      if (!this.isEditing) return;
      e.stopPropagation();
      this.onCopy(e);
    });

    this._disposables.addFromEvent(this, 'cut', e => {
      if (!this.isEditing) return;
      e.stopPropagation();
      this.onCut(e);
    });

    this._disposables.addFromEvent(this, 'paste', e => {
      if (!this.isEditing) return;
      e.stopPropagation();
      this.onPaste(e);
    });
  }

  focusCell() {
    return true;
  }

  forceUpdate(): void {
    this.requestUpdate();
  }

  onChange(value: Value | undefined): void {
    this.column.setValue(this.rowId, value);
  }

  onCopy(_e: ClipboardEvent) {}

  onCut(_e: ClipboardEvent) {}

  onEnterEditMode(): void {
    // do nothing
  }

  onExitEditMode() {
    // do nothing
  }

  onPaste(_e: ClipboardEvent) {}

  get readonly(): boolean {
    return this.column.readonly;
  }

  get value() {
    return this.column.getValue(this.rowId);
  }

  @property({ attribute: false })
  accessor column!: DataViewColumnManager<Value, Data>;

  @property({ attribute: false })
  accessor isEditing!: boolean;

  @property()
  accessor rowId!: string;

  @property({ attribute: false })
  accessor selectCurrentCell!: (editing: boolean) => void;

  @property({ attribute: false })
  accessor view!: DataViewManager;
}
