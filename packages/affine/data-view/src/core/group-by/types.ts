import type { TypeInstance } from '../logical/type.js';
import type { DVJSON } from '../property/types.js';
import type { UniComponent } from '../utils/index.js';

export interface GroupRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = DVJSON,
> {
  data: Data;
  updateData?: (data: Data) => void;
  value: Value;
  updateValue?: (value: Value) => void;
  readonly: boolean;
}

export type GroupByConfig = {
  name: string;
  groupName: (type: TypeInstance, value: unknown) => string;
  defaultKeys: (type: TypeInstance) => {
    key: string;
    value: DVJSON;
  }[];
  valuesGroup: (
    value: unknown,
    type: TypeInstance
  ) => {
    key: string;
    value: DVJSON;
  }[];
  addToGroup?: (value: unknown, oldValue: unknown) => unknown;
  removeFromGroup?: (value: unknown, oldValue: unknown) => unknown;
  view: UniComponent<GroupRenderProps>;
};
