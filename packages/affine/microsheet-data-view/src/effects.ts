import { Overflow } from './core/common/component/overflow/overflow.js';
import { RecordDetail } from './core/common/detail/detail.js';
import { RecordField } from './core/common/detail/field.js';
import {
  NumberLiteral,
  StringLiteral,
} from './core/common/literal/renderer/literal-element.js';
import { DataViewPropertiesSettingView } from './core/common/properties.js';
import { VariableRefView } from './core/common/ref/ref.js';
import { DataViewRenderer } from './core/data-view.js';
import { AffineLitIcon, UniAnyRender, UniLit } from './core/index.js';
import { AnyRender } from './core/utils/uni-component/render-template.js';
import {
  TextCell,
  TextCellEditing,
} from './property-presets/text/cell-renderer.js';
import { DataViewTable } from './view-presets/index.js';
import { MicrosheetCellContainer } from './view-presets/table/cell.js';
import { DragToFillElement } from './view-presets/table/controller/drag-to-fill.js';
import { SelectionElement } from './view-presets/table/controller/selection.js';
import { TableGroup } from './view-presets/table/group.js';
import { MicrosheetColumnHeader } from './view-presets/table/header/column-header.js';
import { DataViewColumnPreview } from './view-presets/table/header/column-renderer.js';
import { MicrosheetHeaderColumn } from './view-presets/table/header/microsheet-header-column.js';
import { TableVerticalIndicator } from './view-presets/table/header/vertical-indicator.js';
import { TableRow } from './view-presets/table/row/row.js';
import { RowSelectCheckbox } from './view-presets/table/row/row-select-checkbox.js';
import { DataViewHeaderTools } from './widget-presets/tools/tools-renderer.js';

export function effects() {
  customElements.define(
    'microsheet-data-view-header-tools',
    DataViewHeaderTools
  );
  customElements.define(
    'affine-microsheet-cell-container',
    MicrosheetCellContainer
  );
  customElements.define(
    'affine-microsheet-data-view-renderer',
    DataViewRenderer
  );
  customElements.define('microsheet-any-render', AnyRender);
  customElements.define(
    'microsheet-data-view-properties-setting',
    DataViewPropertiesSettingView
  );
  customElements.define('affine-microsheet-text-cell', TextCell);
  customElements.define('affine-microsheet-text-cell-editing', TextCellEditing);
  customElements.define(
    'affine-microsheet-data-view-record-field',
    RecordField
  );
  customElements.define('microsheet-data-view-drag-to-fill', DragToFillElement);
  customElements.define('affine-microsheet-data-view-table-group', TableGroup);
  customElements.define(
    'affine-microsheet-data-view-column-preview',
    DataViewColumnPreview
  );
  customElements.define('microsheet-component-overflow', Overflow);
  customElements.define('affine-microsheet-lit-icon', AffineLitIcon);
  customElements.define(
    'microsheet-data-view-literal-number-view',
    NumberLiteral
  );
  customElements.define(
    'microsheet-data-view-literal-string-view',
    StringLiteral
  );
  customElements.define('affine-microsheet-table', DataViewTable);
  customElements.define('microsheet-uni-lit', UniLit);
  customElements.define('microsheet-uni-any-render', UniAnyRender);
  customElements.define(
    'microsheet-data-view-table-selection',
    SelectionElement
  );
  customElements.define('microsheet-variable-ref-view', VariableRefView);
  customElements.define(
    'affine-microsheet-data-view-record-detail',
    RecordDetail
  );
  customElements.define(
    'affine-microsheet-column-header',
    MicrosheetColumnHeader
  );
  customElements.define(
    'affine-microsheet-header-column',
    MicrosheetHeaderColumn
  );
  customElements.define('microsheet-row-select-checkbox', RowSelectCheckbox);
  customElements.define(
    'microsheet-data-view-table-vertical-indicator',
    TableVerticalIndicator
  );
  customElements.define('microsheet-data-view-table-row', TableRow);
}
