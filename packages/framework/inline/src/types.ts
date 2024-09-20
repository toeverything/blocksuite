import type { TemplateResult } from 'lit';

import type { InlineEditor } from './inline-editor.js';
import type { BaseTextAttributes } from './utils/index.js';

export type DeltaInsert<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = {
  insert: string;
  attributes?: TextAttributes;
};

export type AttributeRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = (props: {
  editor: InlineEditor<TextAttributes>;
  delta: DeltaInsert<TextAttributes>;
  selected: boolean;
  startOffset: number;
  endOffset: number;
  lineIndex: number;
}) => TemplateResult<1>;

export interface InlineRange {
  index: number;
  length: number;
}

export type DeltaEntry<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = [delta: DeltaInsert<TextAttributes>, range: InlineRange];

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
