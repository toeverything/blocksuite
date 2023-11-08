import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type {
  DataViewColumnManager,
  DataViewManager,
} from '../data-view-manager.js';
import type { CellRenderProps, DataViewCellLifeCycle } from './manager.js';

export abstract class BaseCellRenderer<
    Value,
    Data extends Record<string, unknown> = Record<string, unknown>,
  >
  extends WithDisposable(ShadowlessElement)
  implements DataViewCellLifeCycle, CellRenderProps<Data, Value>
{
  @property({ attribute: false })
  view!: DataViewManager;
  @property({ attribute: false })
  column!: DataViewColumnManager<Value, Data>;
  @property()
  rowId!: string;
  @property({ attribute: false })
  isEditing!: boolean;
  @property({ attribute: false })
  selectCurrentCell!: (editing: boolean) => void;

  get readonly(): boolean {
    return this.column.readonly;
  }

  get value() {
    return this.column.getValue(this.rowId);
  }

  onChange(value: Value | undefined): void {
    this.column.setValue(this.rowId, value);
  }

  public beforeEnterEditMode(): boolean {
    return true;
  }

  public onEnterEditMode(): void {
    // do nothing
  }

  public onExitEditMode() {
    // do nothing
  }

  public focusCell() {
    return true;
  }

  public blurCell() {
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

  forceUpdate(): void {
    this.requestUpdate();
  }

  onCopy(_e: ClipboardEvent) {}

  onCut(_e: ClipboardEvent) {}

  onPaste(_e: ClipboardEvent) {}
}
