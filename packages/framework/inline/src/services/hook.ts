import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';

export interface BeforeinputHookCtx<TextAttributes extends BaseTextAttributes> {
  attributes: TextAttributes;
  data: null | string;
  inlineEditor: InlineEditor<TextAttributes>;
  inlineRange: InlineRange;
  raw: InputEvent;
}
export interface CompositionEndHookCtx<
  TextAttributes extends BaseTextAttributes,
> {
  attributes: TextAttributes;
  data: null | string;
  inlineEditor: InlineEditor<TextAttributes>;
  inlineRange: InlineRange;
  raw: CompositionEvent;
}

export type HookContext<TextAttributes extends BaseTextAttributes> =
  | BeforeinputHookCtx<TextAttributes>
  | CompositionEndHookCtx<TextAttributes>;

export class InlineHookService<TextAttributes extends BaseTextAttributes> {
  constructor(
    readonly editor: InlineEditor<TextAttributes>,
    readonly hooks: {
      beforeinput?: (props: BeforeinputHookCtx<TextAttributes>) => void;
      compositionEnd?: (props: CompositionEndHookCtx<TextAttributes>) => void;
    } = {}
  ) {}
}
