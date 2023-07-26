import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import { Matcher } from '../../logical/matcher.js';
import type { TType } from '../../logical/typesystem.js';

export interface GroupRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> {
  data: Data;
  updateData?: (data: Data) => void;
  value: Value;
  updateValue?: (value: Value) => void;
}

export const groupByMatcher = new Matcher<{
  name: string;
  defaultKeys: (type: TType) => {
    key: string;
    value: unknown;
  }[];
  valuesGroup: (
    value: unknown,
    type: TType
  ) => {
    key: string;
    value: unknown;
  }[];
  addToGroup?: (value: unknown, oldValue: unknown) => unknown;
  view: UniComponent<GroupRenderProps>;
}>();
