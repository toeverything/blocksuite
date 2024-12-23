import type { TableViewSelectionWithType } from '../view-presets/table/types.js';

export type MicrosheetDataViewSelection = TableViewSelectionWithType;
export type GetMicrosheetDataViewSelection<
  K extends MicrosheetDataViewSelection['type'],
  T = MicrosheetDataViewSelection,
> = T extends {
  type: K;
}
  ? T
  : never;
export type MicrosheetDataViewSelectionState =
  | MicrosheetDataViewSelection
  | undefined;
export type PropertyDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (data: Data) => Partial<Data>;

export interface MicrosheetFlags {
  enable_number_formatting: boolean;
}

export const defaultMicrosheetFlags: Readonly<MicrosheetFlags> = {
  enable_number_formatting: false,
};
