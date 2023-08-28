import type { VRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import type { VEditor } from '../virgo.js';

export interface VBeforeinputHookCtx<
  TextAttributes extends BaseTextAttributes
> {
  vEditor: VEditor<TextAttributes>;
  raw: InputEvent;
  vRange: VRange;
  data: string | null;
  attributes: TextAttributes;
}
export interface VCompositionEndHookCtx<
  TextAttributes extends BaseTextAttributes
> {
  vEditor: VEditor<TextAttributes>;
  raw: CompositionEvent;
  vRange: VRange;
  data: string | null;
  attributes: TextAttributes;
}

export type VHookContext<TextAttributes extends BaseTextAttributes> =
  | VBeforeinputHookCtx<TextAttributes>
  | VCompositionEndHookCtx<TextAttributes>;

export class VirgoHookService<TextAttributes extends BaseTextAttributes> {
  constructor(
    public readonly editor: VEditor<TextAttributes>,
    public readonly hooks: {
      beforeinput?: (
        props: VBeforeinputHookCtx<TextAttributes>
      ) => VBeforeinputHookCtx<TextAttributes> | null;
      compositionEnd?: (
        props: VCompositionEndHookCtx<TextAttributes>
      ) => VCompositionEndHookCtx<TextAttributes> | null;
    } = {}
  ) {}
}
