import { autoPlacement, type ReferenceElement } from '@floating-ui/dom';

import { createPopup } from '../../../components/menu/index.js';
import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import {
  renderUniLit,
  UniLit,
} from '../../../components/uni-component/uni-component.js';
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
  // if (typeof data.edit === 'function') {
  //   data.edit({ value, onChange, type });
  //   return;
  // }
  const uniLit = new UniLit<LiteralViewProps>();
  uniLit.uni = data.edit;
  uniLit.props = { value, onChange, type };
  uniLit.style.position = 'absolute';
  createPopup(target, uniLit, {
    middleware: [
      autoPlacement({
        allowedPlacements: ['top-start', 'bottom-start'],
      }),
    ],
  });
};

export type LiteralViewProps<Value = unknown, Type extends TType = TType> = {
  type: Type;
  value: Value;
  onChange: (value: Value) => void;
};
export type LiteralData<Value = unknown> = {
  view: UniComponent<LiteralViewProps<Value>>;
  edit: UniComponent<LiteralViewProps<Value>>;
};
export const literalMatcher = new Matcher<LiteralData>();
