import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { DataViewColumnManager } from '../data-view-manager.js';
import type { DataViewCellLifeCycle } from './manager.js';

export abstract class BaseCellRenderer<
    Value,
    Data extends Record<string, unknown> = Record<string, unknown>
  >
  extends WithDisposable(ShadowlessElement)
  implements DataViewCellLifeCycle
{
  @property({ attribute: false })
  column!: DataViewColumnManager<Value, Data>;
  @property()
  rowId!: string;
  @property({ attribute: false })
  isEditing!: boolean;
  @property({ attribute: false })
  public selectCurrentCell!: (editing: boolean) => void;

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
    this.style.height = '100%';
    this._disposables.addFromEvent(this, 'click', e => {
      if (this.isEditing) {
        e.stopPropagation();
      }
    });
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      if (this.isEditing) {
        e.stopPropagation();
      }
    });
  }
}
