import { type ReferenceElement } from '@floating-ui/dom';

import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import { renderUniLit } from '../../../components/uni-component/uni-component.js';
import { Matcher } from '../../logical/matcher.js';
import type { TType } from '../../logical/typesystem.js';

export const renderLiteral = (
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  return renderUniLit(data.view, { value, onChange, type });
};

export const popLiteralEdit = (
  target: ReferenceElement,
  type: TType,
  value: unknown,
  onChange: (value: unknown) => void
) => {
  const data = literalMatcher.match(type);
  if (!data) {
    return;
  }
  data.popEdit(target, { value, onChange, type });
};

export type LiteralViewProps<Value = unknown, Type extends TType = TType> = {
  type: Type;
  value?: Value;
  onChange: (value?: Value) => void;
};
export type LiteralData<Value = unknown> = {
  view: UniComponent<LiteralViewProps<Value>>;
  popEdit: (position: ReferenceElement, props: LiteralViewProps<Value>) => void;
};
export const literalMatcher = new Matcher<LiteralData>();
