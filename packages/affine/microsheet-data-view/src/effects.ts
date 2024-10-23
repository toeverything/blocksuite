import { Overflow } from './core/common/component/overflow/overflow.js';
import { RecordDetail } from './core/common/detail/detail.js';
import { RecordField } from './core/common/detail/field.js';
import { BooleanGroupView } from './core/common/group-by/renderer/boolean-group.js';
import { NumberGroupView } from './core/common/group-by/renderer/number-group.js';
import { SelectGroupView } from './core/common/group-by/renderer/select-group.js';
import { StringGroupView } from './core/common/group-by/renderer/string-group.js';
import { GroupSetting } from './core/common/group-by/setting.js';
import { DateLiteral } from './core/common/literal/renderer/date-literal.js';
import {
  BooleanLiteral,
  NumberLiteral,
  StringLiteral,
} from './core/common/literal/renderer/literal-element.js';
import {
  MultiTagLiteral,
  TagLiteral,
} from './core/common/literal/renderer/tag-literal.js';
import { TagLiteral as UnionTagLiteral } from './core/common/literal/renderer/union-string.js';
import { DataViewPropertiesSettingView } from './core/common/properties.js';
import { VariableRefView } from './core/common/ref/ref.js';
import { DataViewRenderer } from './core/data-view.js';
import {
  AffineLitIcon,
  MultiTagSelect,
  MultiTagView,
  UniAnyRender,
  UniLit,
} from './core/index.js';
import { AnyRender } from './core/utils/uni-component/render-template.js';
import { CheckboxCell } from './property-presets/checkbox/cell-renderer.js';
import {
  DateCell,
  DateCellEditing,
} from './property-presets/date/cell-renderer.js';
import { TextCell as ImageTextCell } from './property-presets/image/cell-renderer.js';
import {
  MultiSelectCell,
  MultiSelectCellEditing,
} from './property-presets/multi-select/cell-renderer.js';
import {
  NumberCell,
  NumberCellEditing,
} from './property-presets/number/cell-renderer.js';
import {
  ProgressCell,
  ProgressCellEditing,
} from './property-presets/progress/cell-renderer.js';
import {
  SelectCell,
  SelectCellEditing,
} from './property-presets/select/cell-renderer.js';
import {
  TextCell,
  TextCellEditing,
} from './property-presets/text/cell-renderer.js';
import { DataViewKanban, DataViewTable } from './view-presets/index.js';
import { KanbanCard } from './view-presets/kanban/card.js';
import { KanbanCell } from './view-presets/kanban/cell.js';
import { KanbanGroup } from './view-presets/kanban/group.js';
import { KanbanHeader } from './view-presets/kanban/header.js';
import { MicrosheetCellContainer } from './view-presets/table/cell.js';
import { DragToFillElement } from './view-presets/table/controller/drag-to-fill.js';
import { SelectionElement } from './view-presets/table/controller/selection.js';
import { TableGroup } from './view-presets/table/group.js';
import { MicrosheetColumnHeader } from './view-presets/table/header/column-header.js';
import { DataViewColumnPreview } from './view-presets/table/header/column-renderer.js';
import { MicrosheetHeaderColumn } from './view-presets/table/header/microsheet-header-column.js';
import { MicrosheetNumberFormatBar } from './view-presets/table/header/number-format-bar.js';
import { TableVerticalIndicator } from './view-presets/table/header/vertical-indicator.js';
import { TableRow } from './view-presets/table/row/row.js';
import { RowSelectCheckbox } from './view-presets/table/row/row-select-checkbox.js';
import { MicrosheetColumnStats } from './view-presets/table/stats/column-stats-bar.js';
import { MicrosheetColumnStatsCell } from './view-presets/table/stats/column-stats-column.js';
import { FilterConditionView } from './widget-presets/filter/condition.js';
import { FilterBar } from './widget-presets/filter/filter-bar.js';
import { FilterGroupView } from './widget-presets/filter/filter-group.js';
import { FilterRootView } from './widget-presets/filter/filter-root.js';
import { DataViewHeaderToolsFilter } from './widget-presets/tools/presets/filter/filter.js';
import { DataViewHeaderToolsSearch } from './widget-presets/tools/presets/search/search.js';
import { DataViewHeaderToolsAddRow } from './widget-presets/tools/presets/table-add-row/add-row.js';
import { NewRecordPreview } from './widget-presets/tools/presets/table-add-row/new-record-preview.js';
import { DataViewHeaderToolsViewOptions } from './widget-presets/tools/presets/view-options/view-options.js';
import { DataViewHeaderTools } from './widget-presets/tools/tools-renderer.js';
import { DataViewHeaderViews } from './widget-presets/views-bar/views.js';

export function effects() {
  customElements.define('affine-microsheet-progress-cell', ProgressCell);
  customElements.define(
    'affine-microsheet-progress-cell-editing',
    ProgressCellEditing
  );
  customElements.define(
    'microsheet-data-view-header-tools',
    DataViewHeaderTools
  );
  customElements.define('affine-microsheet-number-cell', NumberCell);
  customElements.define(
    'affine-microsheet-number-cell-editing',
    NumberCellEditing
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
  customElements.define('affine-microsheet-image-cell', ImageTextCell);
  customElements.define('affine-microsheet-date-cell', DateCell);
  customElements.define('affine-microsheet-date-cell-editing', DateCellEditing);
  customElements.define(
    'microsheet-data-view-properties-setting',
    DataViewPropertiesSettingView
  );
  customElements.define('affine-microsheet-checkbox-cell', CheckboxCell);
  customElements.define('affine-microsheet-text-cell', TextCell);
  customElements.define('affine-microsheet-text-cell-editing', TextCellEditing);
  customElements.define('affine-microsheet-select-cell', SelectCell);
  customElements.define(
    'affine-microsheet-select-cell-editing',
    SelectCellEditing
  );
  customElements.define('affine-microsheet-multi-select-cell', MultiSelectCell);
  customElements.define(
    'affine-microsheet-multi-select-cell-editing',
    MultiSelectCellEditing
  );
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
  customElements.define(
    'microsheet-data-view-group-title-select-view',
    SelectGroupView
  );
  customElements.define(
    'microsheet-data-view-group-title-string-view',
    StringGroupView
  );
  customElements.define('affine-microsheet-data-view-kanban-card', KanbanCard);
  customElements.define('microsheet-filter-bar', FilterBar);
  customElements.define(
    'microsheet-data-view-group-title-number-view',
    NumberGroupView
  );
  customElements.define('affine-microsheet-data-view-kanban-cell', KanbanCell);
  customElements.define('affine-microsheet-lit-icon', AffineLitIcon);
  customElements.define(
    'microsheet-filter-condition-view',
    FilterConditionView
  );
  customElements.define(
    'microsheet-data-view-literal-boolean-view',
    BooleanLiteral
  );
  customElements.define(
    'microsheet-data-view-literal-number-view',
    NumberLiteral
  );
  customElements.define(
    'microsheet-data-view-literal-string-view',
    StringLiteral
  );
  customElements.define('microsheet-data-view-group-setting', GroupSetting);
  customElements.define('microsheet-data-view-literal-tag-view', TagLiteral);
  customElements.define(
    'microsheet-data-view-literal-multi-tag-view',
    MultiTagLiteral
  );
  customElements.define(
    'microsheet-data-view-literal-union-string-view',
    UnionTagLiteral
  );
  customElements.define('affine-microsheet-multi-tag-select', MultiTagSelect);
  customElements.define(
    'microsheet-data-view-group-title-boolean-view',
    BooleanGroupView
  );
  customElements.define('microsheet-data-view-literal-date-view', DateLiteral);
  customElements.define('affine-microsheet-table', DataViewTable);
  customElements.define('affine-microsheet-multi-tag-view', MultiTagView);
  customElements.define(
    'microsheet-data-view-header-tools-search',
    DataViewHeaderToolsSearch
  );
  customElements.define('microsheet-uni-lit', UniLit);
  customElements.define('microsheet-uni-any-render', UniAnyRender);
  customElements.define('microsheet-filter-group-view', FilterGroupView);
  customElements.define(
    'microsheet-data-view-header-tools-add-row',
    DataViewHeaderToolsAddRow
  );
  customElements.define(
    'microsheet-data-view-table-selection',
    SelectionElement
  );
  customElements.define(
    'affine-microsheet-new-record-preview',
    NewRecordPreview
  );
  customElements.define(
    'affine-microsheet-data-view-kanban-group',
    KanbanGroup
  );
  customElements.define(
    'microsheet-data-view-header-tools-filter',
    DataViewHeaderToolsFilter
  );
  customElements.define(
    'microsheet-data-view-header-tools-view-options',
    DataViewHeaderToolsViewOptions
  );
  customElements.define('affine-microsheet-data-view-kanban', DataViewKanban);
  customElements.define(
    'affine-microsheet-data-view-kanban-header',
    KanbanHeader
  );
  customElements.define('microsheet-variable-ref-view', VariableRefView);
  customElements.define(
    'affine-microsheet-data-view-record-detail',
    RecordDetail
  );
  customElements.define('microsheet-filter-root-view', FilterRootView);
  customElements.define(
    'affine-microsheet-column-header',
    MicrosheetColumnHeader
  );
  customElements.define(
    'microsheet-data-view-header-views',
    DataViewHeaderViews
  );
  customElements.define(
    'affine-microsheet-number-format-bar',
    MicrosheetNumberFormatBar
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
  customElements.define(
    'affine-microsheet-column-stats',
    MicrosheetColumnStats
  );
  customElements.define(
    'affine-microsheet-column-stats-cell',
    MicrosheetColumnStatsCell
  );
}
