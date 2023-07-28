import { createUniComponentFromWebComponent } from '../../../components/uni-component/uni-component.js';
import type { BaseCellRenderer } from './cellRenderer/base-cell.js';
import { CheckboxCell } from './cellRenderer/checkbox.js';
import { DateCell, DateCellEditing } from './cellRenderer/date.js';
import { LinkCell, LinkCellEditing } from './cellRenderer/link.js';
import {
  MultiSelectCell,
  MultiSelectCellEditing,
} from './cellRenderer/multi-select.js';
import { NumberCell, NumberCellEditing } from './cellRenderer/number.js';
import { ProgressCell, ProgressCellEditing } from './cellRenderer/progress.js';
import { RichTextCell, RichTextCellEditing } from './cellRenderer/rich-text.js';
import { SelectCell, SelectCellEditing } from './cellRenderer/select.js';
import { TextCell, TextCellEditing } from './cellRenderer/text.js';
import { TitleCell } from './cellRenderer/title.js';
import {
  checkboxHelper,
  dateHelper,
  linkHelper,
  multiSelectHelper,
  numberHelper,
  progressHelper,
  richTextHelper,
  selectHelper,
  textHelper,
  titleHelper,
} from './define.js';
import type { CellRenderer, DataViewCellComponent } from './manager.js';

export interface Renderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> {
  type: string;
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
      throw new Error('cannot find renderer');
    }
    return renderer;
  }

  list(): Renderer[] {
    return [...this._columns.values()];
  }
}

export const columnRenderer = new ColumnRendererHelper();

const createFromBaseCellRenderer = <
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>
>(
  renderer: typeof BaseCellRenderer<Value, Data>
): DataViewCellComponent => {
  return createUniComponentFromWebComponent(renderer as never) as never;
};

columnRenderer.register({
  type: titleHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(TitleCell),
  },
});
columnRenderer.register({
  type: richTextHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});
columnRenderer.register({
  type: selectHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(SelectCell),
    edit: createFromBaseCellRenderer(SelectCellEditing),
  },
});
columnRenderer.register({
  type: multiSelectHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(MultiSelectCell),
    edit: createFromBaseCellRenderer(MultiSelectCellEditing),
  },
});
columnRenderer.register({
  type: numberHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(NumberCell),
    edit: createFromBaseCellRenderer(NumberCellEditing),
  },
});
columnRenderer.register({
  type: checkboxHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(CheckboxCell),
  },
});
columnRenderer.register({
  type: progressHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(ProgressCell),
    edit: createFromBaseCellRenderer(ProgressCellEditing),
  },
});
columnRenderer.register({
  type: linkHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(LinkCell),
    edit: createFromBaseCellRenderer(LinkCellEditing),
  },
});

columnRenderer.register({
  type: textHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(TextCell),
    edit: createFromBaseCellRenderer(TextCellEditing),
  },
});

columnRenderer.register({
  type: dateHelper.type,
  cellRenderer: {
    view: createFromBaseCellRenderer(DateCell),
    edit: createFromBaseCellRenderer(DateCellEditing),
  },
});
