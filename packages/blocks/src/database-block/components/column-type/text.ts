import { defineTagSchemaRenderer } from '@blocksuite/global/database';
import { LitElement } from 'lit';

export const TextTagSchemaRenderer = defineTagSchemaRenderer(
  'text',
  () => ({}),
  () => '',
  {
    CellPreview: class TextCellPreview extends LitElement {},
    CellEditing: class TextCellEditing extends LitElement {},

    ColumnPropertyEditing: class TextColumnPropertyEditing extends LitElement {},
  },
  {
    displayName: 'Text',
  }
);
