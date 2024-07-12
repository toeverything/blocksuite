import type { InlineEditor, KeyboardBindingContext } from '@blocksuite/inline';
import type { Y } from '@blocksuite/store';

import {
  type AttributeRenderer,
  type BaseTextAttributes,
  type DeltaInsert,
  type InlineRange,
  KEYBOARD_ALLOW_DEFAULT,
  type KeyboardBindingHandler,
  baseTextAttributes,
  getDefaultAttributeRenderer,
} from '@blocksuite/inline';
import { type ZodObject, type ZodTypeAny, z } from 'zod';

export type InlineSpecs<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = {
  name: string;
  schema: ZodTypeAny;
  match: (delta: DeltaInsert<TextAttributes>) => boolean;
  renderer: AttributeRenderer<TextAttributes>;
  embed?: boolean;
};

export type InlineMarkdownMatchAction<
  // @ts-expect-error We allow to covariance for TextAttributes
  in TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = (props: {
  inlineEditor: InlineEditor<TextAttributes>;
  prefixText: string;
  inlineRange: InlineRange;
  pattern: RegExp;
  undoManager: Y.UndoManager;
}) => ReturnType<KeyboardBindingHandler>;

export type InlineMarkdownMatch<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = {
  name: string;
  pattern: RegExp;
  action: InlineMarkdownMatchAction<TextAttributes>;
};

export class InlineManager<
  in out TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> {
  private _markdownMatches: InlineMarkdownMatch<TextAttributes>[] = [];

  private _specs: InlineSpecs<TextAttributes>[] = [];

  embedChecker = (delta: DeltaInsert<TextAttributes>) => {
    for (const spec of this._specs) {
      if (spec.embed && spec.match(delta)) {
        return true;
      }
    }
    return false;
  };

  markdownShortcutHandler = (
    context: KeyboardBindingContext<TextAttributes>,
    undoManager: Y.UndoManager
  ) => {
    const { inlineEditor, prefixText, inlineRange } = context;
    for (const match of this._markdownMatches) {
      const matchedText = prefixText.match(match.pattern);
      if (matchedText) {
        return match.action({
          inlineEditor,
          prefixText,
          inlineRange,
          pattern: match.pattern,
          undoManager,
        });
      }
    }

    return KEYBOARD_ALLOW_DEFAULT;
  };

  getRenderer(): AttributeRenderer<TextAttributes> {
    const defaultRenderer = getDefaultAttributeRenderer<TextAttributes>();

    const renderer: AttributeRenderer<TextAttributes> = (delta, selected) => {
      // Priority increases from front to back
      for (const spec of this._specs.toReversed()) {
        if (spec.match(delta)) {
          return spec.renderer(delta, selected);
        }
      }
      return defaultRenderer(delta, selected);
    };
    return renderer;
  }

  getSchema(): ZodObject<Record<keyof TextAttributes, ZodTypeAny>> {
    const defaultSchema = baseTextAttributes as unknown as ZodObject<
      Record<keyof TextAttributes, ZodTypeAny>
    >;

    const schema: ZodObject<Record<keyof TextAttributes, ZodTypeAny>> =
      this._specs.reduce((acc, cur) => {
        const currentSchema = z.object({
          [cur.name]: cur.schema,
        }) as ZodObject<Record<keyof TextAttributes, ZodTypeAny>>;
        return acc.merge(currentSchema) as ZodObject<
          Record<keyof TextAttributes, ZodTypeAny>
        >;
      }, defaultSchema);
    return schema;
  }

  registerMarkdownMatches(
    markdownMatches: InlineMarkdownMatch<TextAttributes>[]
  ): void {
    this._markdownMatches = markdownMatches;
  }

  registerSpecs(specs: InlineSpecs<TextAttributes>[]): void {
    this._specs = specs;
  }

  get markdownMatches() {
    return this._markdownMatches;
  }

  get specs() {
    return this._specs;
  }
}
