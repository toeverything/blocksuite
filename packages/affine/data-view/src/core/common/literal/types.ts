import type { TType } from '../../logical/index.js';
import type { UniComponent } from '../../utils/index.js';

export type LiteralViewProps<Value = unknown, Type extends TType = TType> = {
  type: Type;
  value?: Value;
  onChange: (value?: Value) => void;
};
export type LiteralData<Value = unknown> = {
  view: UniComponent<LiteralViewProps<Value>>;
  popEdit: (position: HTMLElement, props: LiteralViewProps<Value>) => void;
};
