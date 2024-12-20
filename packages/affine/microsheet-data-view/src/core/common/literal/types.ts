import type { PopupTarget } from '@blocksuite/affine-components/context-menu';
import type { ReadonlySignal } from '@preact/signals-core';

import type { TType } from '../../logical/index.js';
import type { UniComponent } from '../../utils/index.js';

export type LiteralViewProps<Value = unknown, Type extends TType = TType> = {
  type: Type;
  value$: ReadonlySignal<Value | undefined>;
  onChange: (value?: Value) => void;
};
export type LiteralData<Value = unknown> = {
  view: UniComponent<LiteralViewProps<Value>>;
  popEdit: (position: PopupTarget, props: LiteralViewProps<Value>) => void;
};
