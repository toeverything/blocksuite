import { assertExists } from '@blocksuite/global/utils';
import type { TemplateResult } from 'lit';

export type ColumnType = string;

export type ColumnTypeIcon = Record<ColumnType, TemplateResult>;

export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: ColumnType;
  name: string;
  data: Data;
}

export const getTableContainer = (ele: HTMLElement) => {
  const element = ele.closest(
    '.affine-database-table-container'
  ) as HTMLElement;
  assertExists(element);
  return element;
};
