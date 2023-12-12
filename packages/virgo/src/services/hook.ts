import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';

export interface BeforeinputHookCtx<TextAttributes extends BaseTextAttributes> {
  inlineEditor: InlineEditor<TextAttributes>;
  raw: InputEvent;
  inlineRange: InlineRange;
  data: string | null;
  attributes: TextAttributes;
}
export interface CompositionEndHookCtx<
  TextAttributes extends BaseTextAttributes,
> {
  inlineEditor: InlineEditor<TextAttributes>;
  raw: CompositionEvent;
  inlineRange: InlineRange;
  data: string | null;
  attributes: TextAttributes;
}

export type HookContext<TextAttributes extends BaseTextAttributes> =
  | BeforeinputHookCtx<TextAttributes>
  | CompositionEndHookCtx<TextAttributes>;

export class InlineHookService<TextAttributes extends BaseTextAttributes> {
  constructor(
    public readonly editor: InlineEditor<TextAttributes>,
    public readonly hooks: {
      beforeinput?: (
        props: BeforeinputHookCtx<TextAttributes>
      ) => BeforeinputHookCtx<TextAttributes> | null;
      compositionEnd?: (
        props: CompositionEndHookCtx<TextAttributes>
      ) => CompositionEndHookCtx<TextAttributes> | null;
    } = {}
  ) {}
}
