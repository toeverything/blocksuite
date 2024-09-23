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
import { DatabaseCellContainer } from './view-presets/table/cell.js';
import { DragToFillElement } from './view-presets/table/controller/drag-to-fill.js';
import { SelectionElement } from './view-presets/table/controller/selection.js';
import { TableGroup } from './view-presets/table/group.js';
import { DatabaseColumnHeader } from './view-presets/table/header/column-header.js';
import { DataViewColumnPreview } from './view-presets/table/header/column-renderer.js';
import { DatabaseHeaderColumn } from './view-presets/table/header/database-header-column.js';
import { DatabaseNumberFormatBar } from './view-presets/table/header/number-format-bar.js';
import { TableVerticalIndicator } from './view-presets/table/header/vertical-indicator.js';
import { TableRow } from './view-presets/table/row/row.js';
import { RowSelectCheckbox } from './view-presets/table/row/row-select-checkbox.js';
import { DataBaseColumnStats } from './view-presets/table/stats/column-stats-bar.js';
import { DatabaseColumnStatsCell } from './view-presets/table/stats/column-stats-column.js';
import { FilterConditionView } from './widget-presets/filter/condition.js';
import { FilterBar } from './widget-presets/filter/filter-bar.js';
import { FilterGroupView } from './widget-presets/filter/filter-group.js';
import { AdvancedFilterModal } from './widget-presets/filter/filter-modal.js';
import { FilterRootView } from './widget-presets/filter/filter-root.js';
import { DataViewHeaderToolsFilter } from './widget-presets/tools/presets/filter/filter.js';
import { DataViewHeaderToolsSearch } from './widget-presets/tools/presets/search/search.js';
import { DataViewHeaderToolsAddRow } from './widget-presets/tools/presets/table-add-row/add-row.js';
import { NewRecordPreview } from './widget-presets/tools/presets/table-add-row/new-record-preview.js';
import { DataViewHeaderToolsViewOptions } from './widget-presets/tools/presets/view-options/view-options.js';
import { DataViewHeaderTools } from './widget-presets/tools/tools-renderer.js';
import { DataViewHeaderViews } from './widget-presets/views-bar/views.js';

export function effects() {
  customElements.define('affine-database-progress-cell', ProgressCell);
  customElements.define(
    'affine-database-progress-cell-editing',
    ProgressCellEditing
  );
  customElements.define('data-view-header-tools', DataViewHeaderTools);
  customElements.define('affine-database-number-cell', NumberCell);
  customElements.define(
    'affine-database-number-cell-editing',
    NumberCellEditing
  );
  customElements.define(
    'affine-database-cell-container',
    DatabaseCellContainer
  );
  customElements.define('affine-data-view-renderer', DataViewRenderer);
  customElements.define('any-render', AnyRender);
  customElements.define('affine-database-image-cell', ImageTextCell);
  customElements.define('affine-database-date-cell', DateCell);
  customElements.define('affine-database-date-cell-editing', DateCellEditing);
  customElements.define(
    'data-view-properties-setting',
    DataViewPropertiesSettingView
  );
  customElements.define('affine-database-checkbox-cell', CheckboxCell);
  customElements.define('affine-database-text-cell', TextCell);
  customElements.define('affine-database-text-cell-editing', TextCellEditing);
  customElements.define('affine-database-select-cell', SelectCell);
  customElements.define(
    'affine-database-select-cell-editing',
    SelectCellEditing
  );
  customElements.define('affine-database-multi-select-cell', MultiSelectCell);
  customElements.define(
    'affine-database-multi-select-cell-editing',
    MultiSelectCellEditing
  );
  customElements.define('affine-data-view-record-field', RecordField);
  customElements.define('data-view-drag-to-fill', DragToFillElement);
  customElements.define('affine-data-view-table-group', TableGroup);
  customElements.define(
    'affine-data-view-column-preview',
    DataViewColumnPreview
  );
  customElements.define('component-overflow', Overflow);
  customElements.define('data-view-group-title-select-view', SelectGroupView);
  customElements.define('data-view-group-title-string-view', StringGroupView);
  customElements.define('affine-data-view-kanban-card', KanbanCard);
  customElements.define('filter-bar', FilterBar);
  customElements.define('data-view-group-title-number-view', NumberGroupView);
  customElements.define('affine-data-view-kanban-cell', KanbanCell);
  customElements.define('affine-lit-icon', AffineLitIcon);
  customElements.define('filter-condition-view', FilterConditionView);
  customElements.define('data-view-literal-boolean-view', BooleanLiteral);
  customElements.define('data-view-literal-number-view', NumberLiteral);
  customElements.define('data-view-literal-string-view', StringLiteral);
  customElements.define('data-view-group-setting', GroupSetting);
  customElements.define('advanced-filter-modal', AdvancedFilterModal);
  customElements.define('data-view-literal-tag-view', TagLiteral);
  customElements.define('data-view-literal-multi-tag-view', MultiTagLiteral);
  customElements.define('data-view-literal-union-string-view', UnionTagLiteral);
  customElements.define('affine-multi-tag-select', MultiTagSelect);
  customElements.define('data-view-group-title-boolean-view', BooleanGroupView);
  customElements.define('data-view-literal-date-view', DateLiteral);
  customElements.define('affine-database-table', DataViewTable);
  customElements.define('affine-multi-tag-view', MultiTagView);
  customElements.define(
    'data-view-header-tools-search',
    DataViewHeaderToolsSearch
  );
  customElements.define('uni-lit', UniLit);
  customElements.define('uni-any-render', UniAnyRender);
  customElements.define('filter-group-view', FilterGroupView);
  customElements.define(
    'data-view-header-tools-add-row',
    DataViewHeaderToolsAddRow
  );
  customElements.define('data-view-table-selection', SelectionElement);
  customElements.define('affine-database-new-record-preview', NewRecordPreview);
  customElements.define('affine-data-view-kanban-group', KanbanGroup);
  customElements.define(
    'data-view-header-tools-filter',
    DataViewHeaderToolsFilter
  );
  customElements.define(
    'data-view-header-tools-view-options',
    DataViewHeaderToolsViewOptions
  );
  customElements.define('affine-data-view-kanban', DataViewKanban);
  customElements.define('affine-data-view-kanban-header', KanbanHeader);
  customElements.define('variable-ref-view', VariableRefView);
  customElements.define('affine-data-view-record-detail', RecordDetail);
  customElements.define('filter-root-view', FilterRootView);
  customElements.define('affine-database-column-header', DatabaseColumnHeader);
  customElements.define('data-view-header-views', DataViewHeaderViews);
  customElements.define(
    'affine-database-number-format-bar',
    DatabaseNumberFormatBar
  );
  customElements.define('affine-database-header-column', DatabaseHeaderColumn);
  customElements.define('row-select-checkbox', RowSelectCheckbox);
  customElements.define(
    'data-view-table-vertical-indicator',
    TableVerticalIndicator
  );
  customElements.define('data-view-table-row', TableRow);
  customElements.define('affine-database-column-stats', DataBaseColumnStats);
  customElements.define(
    'affine-database-column-stats-cell',
    DatabaseColumnStatsCell
  );
}
