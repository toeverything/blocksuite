import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { property } from 'lit/decorators.js';

import type { Cell } from '../view-manager/cell.js';
import type { CellRenderProps, DataViewCellLifeCycle } from './manager.js';

export abstract class BaseCellRenderer<
    Value,
    Data extends Record<string, unknown> = Record<string, unknown>,
  >
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements DataViewCellLifeCycle, CellRenderProps<Data, Value>
{
  @property({ attribute: false })
  accessor cell!: Cell<Value, Data>;

  readonly$ = computed(() => {
    return this.cell.property.readonly$.value;
  });

  value$ = computed(() => {
    return this.cell.value$.value;
  });

  get property() {
    return this.cell.property;
  }

  get readonly() {
    return this.readonly$.value;
  }

  get row() {
    return this.cell.row;
  }

  get value() {
    return this.value$.value;
  }

  get view() {
    return this.cell.view;
  }

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
    this.cell.valueSet(value);
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

  @property({ attribute: false })
  accessor isEditing!: boolean;

  @property({ attribute: false })
  accessor selectCurrentCell!: (editing: boolean) => void;
}
