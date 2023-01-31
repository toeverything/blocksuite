import { defineTagSchemaRenderer } from '@blocksuite/global/database';
import { LitElement } from 'lit';

export const NumberTagSchemaRenderer = defineTagSchemaRenderer(
  'number',
  () => ({
    decimal: 0,
  }),
  () => 0,
  {
    CellPreview: class NumberCellPreview extends LitElement {},
    CellEditing: class NumberCellEditing extends LitElement {},

    ColumnPropertyEditing: class NumberColumnPropertyEditing extends LitElement {},
  },
  {
    displayName: 'Number',
  }
);
