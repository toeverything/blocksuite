export interface Column<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: string;
  name: string;
  data: Data;
}

export type ColumnUpdater<T extends Column = Column> = (data: T) => Partial<T>;
export type Cell<ValueType = unknown> = {
  columnId: Column['id'];
  value: ValueType;
};

export type SerializedCells = Record<string, Record<string, Cell>>;
export type ViewBasicDataType = {
  id: string;
  name: string;
  mode: string;
};
