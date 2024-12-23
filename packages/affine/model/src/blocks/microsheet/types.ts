export interface MicrosheetColumn<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: string;
  name: string;
  data: Data;
}

export type MicrosheetColumnUpdater<
  T extends MicrosheetColumn = MicrosheetColumn,
> = (data: T) => Partial<T>;
export type MicrosheetCell<ValueType = unknown> = {
  columnId: MicrosheetColumn['id'];
  value: ValueType;
  ref: string;
};

export type MicrosheetSerializedCells = Record<
  string,
  Record<string, MicrosheetCell>
>;
export type MicrosheetViewBasicDataType = {
  id: string;
  name: string;
  mode: string;
};
