import type { TType } from '../../logical/typesystem.js';

import { Matcher } from '../../logical/matcher.js';
import {
  type UniComponent,
  renderUniLit,
} from '../../utils/uni-component/uni-component.js';

export const renderLiteral = (
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  return renderUniLit(data.view, { onChange, type, value });
};

export const popLiteralEdit = (
  target: HTMLElement,
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  data.popEdit(target, { onChange, type, value });
};

export type LiteralViewProps<Value = unknown, Type extends TType = TType> = {
  onChange: (value?: Value) => void;
  type: Type;
  value?: Value;
};
export type LiteralData<Value = unknown> = {
  popEdit: (position: HTMLElement, props: LiteralViewProps<Value>) => void;
  view: UniComponent<LiteralViewProps<Value>>;
};
export const literalMatcher = new Matcher<LiteralData>();
