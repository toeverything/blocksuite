import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import { createUniComponentFromWebComponent } from '../../../components/uni-component/uni-component.js';
import type { BaseCellRenderer } from './base-cell.js';
import type { CellRenderer, DataViewCellComponent } from './manager.js';

export interface Renderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> {
  type: string;
  icon?: UniComponent;
  cellRenderer: CellRenderer<Data, Value>;
}

export class ColumnRendererHelper {
  private _columns = new Map<string, Renderer>();

  register(renderer: Renderer) {
    const columns = this._columns;
    if (columns.has(renderer.type)) {
      throw new Error('cannot register twice for ' + renderer.type);
    }
    columns.set(renderer.type, renderer);
  }

  get(type: Renderer['type']): Renderer {
    const renderer = this._columns.get(type);
    if (!renderer) {
      throw new Error(`cannot find renderer of ${type}`);
    }
    return renderer;
  }

  list(): Renderer[] {
    return [...this._columns.values()];
  }
}

export const columnRenderer = new ColumnRendererHelper();

export const createFromBaseCellRenderer = <
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>
>(
  renderer: new () => BaseCellRenderer<Value, Data>
): DataViewCellComponent => {
  return createUniComponentFromWebComponent(renderer as never) as never;
};
