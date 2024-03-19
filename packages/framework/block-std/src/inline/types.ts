import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export type AttributeRenderer<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = (
  delta: DeltaInsert<TextAttributes>,
  selected: boolean
) => TemplateResult<1>;

export interface InlineRange {
  index: number;
  length: number;
}

export type InlineRangeUpdatedProp = [range: InlineRange | null, sync: boolean];

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
