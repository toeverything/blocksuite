import { defineTagSchemaRenderer } from '@blocksuite/global/database';
import { LitElement } from 'lit';

export const SelectTagSchemaRenderer = defineTagSchemaRenderer<string>(
  'select',
  () => ({
    selection: [],
  }),
  () => null,
  {
    CellPreview: class SelectCellPreview extends LitElement {},
    CellEditing: class SelectCellEditing extends LitElement {},

    ColumnPropertyEditing: class SelectColumnPropertyEditing extends LitElement {},
  },
  {
    displayName: 'Select',
  }
);
