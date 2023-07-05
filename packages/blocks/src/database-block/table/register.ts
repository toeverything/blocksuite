import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';
import type { literal } from 'lit/static-html.js';

import type { ColumnManager } from './table-view-manager.js';
import type { ColumnType, SetValueOption } from './types.js';

export abstract class DatabaseCellElement<
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>
> extends WithDisposable(ShadowlessElement) {
  static tag: ReturnType<typeof literal>;
  @property({ attribute: false })
  column!: ColumnManager<Value, Data>;
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

  public onEnterEditMode(): boolean {
    return true;
  }

  public onExitEditMode() {
    // do nothing
  }

  override connectedCallback() {
    super.connectedCallback();
    this.style.width = '100%';
    this.style.height = '100%';
    this._disposables.addFromEvent(this, 'click', e => {
      this.selectCurrentCell(true);
    });
  }

  public focusCell() {
    this.parentElement?.focus();
  }

  public blurCell() {
    this.parentElement?.blur();
  }
}

export interface ColumnRenderer<
  Type extends ColumnType = ColumnType,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  displayName: string;
  type: Type;
  components: ColumnComponents;
}

export interface ColumnComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Cell: typeof DatabaseCellElement<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CellEditing: typeof DatabaseCellElement<any, any> | null;
}

export function defineColumnRenderer<
  Type extends ColumnType,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  components: ColumnComponents,
  config: {
    displayName: string;
  }
): ColumnRenderer<Type, Property, Value> {
  customElements.define(
    components.Cell.tag._$litStatic$,
    components.Cell as never
  );
  if (components.CellEditing) {
    customElements.define(
      components.CellEditing.tag._$litStatic$,
      components.CellEditing as never
    );
  }
  return {
    displayName: config.displayName,
    type,
    components,
  };
}

export class ColumnRendererHelper {
  private _columns = new Map<ColumnRenderer['type'], ColumnRenderer>();

  register(renderer: ColumnRenderer) {
    const columns = this._columns;
    if (columns.has(renderer.type)) {
      throw new Error('cannot register twice for ' + renderer.type);
    }
    columns.set(renderer.type, renderer);
  }

  get(type: ColumnRenderer['type']): ColumnRenderer {
    const renderer = this._columns.get(type);
    if (!renderer) {
      throw new Error('cannot find renderer');
    }
    return renderer;
  }

  list(): ColumnRenderer[] {
    return [...this._columns.values()];
  }
}
