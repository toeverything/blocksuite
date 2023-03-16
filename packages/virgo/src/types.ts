import type { TemplateResult } from 'lit';

import type { VText } from './components/index.js';
import type { BaseTextAttributes } from './utils/index.js';

export type DeltaInsert<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = {
  insert: string;
  attributes?: TextAttributes;
};

export type AttributesRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> = (vText: VText, attributes?: TextAttributes) => TemplateResult<1>;

export interface VRange {
  index: number;
  length: number;
}

export type VRangeUpdatedProp = [
  range: VRange | null,
  type: 'native' | 'input' | 'other'
];

export type DeltaEntry = [delta: DeltaInsert, range: VRange];

// corresponding to [anchorNode/focusNode, anchorOffset/focusOffset]
export type NativePoint = readonly [node: Node, offset: number];
// the number here is relative to the text node
export type TextPoint = readonly [text: Text, offset: number];

export interface DomPoint {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}
