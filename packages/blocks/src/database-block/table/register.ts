import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { DataViewColumnManager } from '../common/data-view-manager.js';
import type { SetValueOption } from './types.js';

export interface DataViewCellLifeCycle {
  beforeEnterEditMode(): boolean;

  onEnterEditMode(): void;

  onExitEditMode(): void;

  focusCell(): boolean;

  blurCell(): boolean;
}

export abstract class DatabaseCellElement<
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

  onChange(value: Value | undefined, ops?: SetValueOption): void {
    this.column.setValue(this.rowId, value, ops);
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
      this.selectCurrentCell(true);
    });
  }
}
