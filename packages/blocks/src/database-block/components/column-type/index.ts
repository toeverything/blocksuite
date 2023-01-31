import { defineTagSchemaRenderer } from '@blocksuite/global/database';
import { LitElement } from 'lit';

export function registerInternal() {
  defineTagSchemaRenderer(
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

  defineTagSchemaRenderer(
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

  defineTagSchemaRenderer<string>(
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
}
