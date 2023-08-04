import type { TemplateResult } from 'lit';

export type ColumnType = string;

export type ColumnTypeIcon = Record<ColumnType, TemplateResult>;

export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  id: string;
  type: ColumnType;
  name: string;
  data: Data;
}

export type ColumnHeader = {
  type: ColumnType;
  text: string;
  icon: TemplateResult;
};
