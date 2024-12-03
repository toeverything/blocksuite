import type {
  AttributeRenderer,
  BaseTextAttributes,
  DeltaInsert,
  InlineEditor,
  InlineRange,
  KeyboardBindingHandler,
} from '@blocksuite/inline';
import type { Y } from '@blocksuite/store';
import type { ZodTypeAny } from 'zod';

export type InlineSpecs<
  AffineTextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = {
  name: keyof AffineTextAttributes | string;
  schema: ZodTypeAny;
  match: (delta: DeltaInsert<AffineTextAttributes>) => boolean;
  renderer: AttributeRenderer<AffineTextAttributes>;
  embed?: boolean;
};

export type InlineMarkdownMatchAction<
  // @ts-expect-error We allow to covariance for AffineTextAttributes
  in AffineTextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = (props: {
  inlineEditor: InlineEditor<AffineTextAttributes>;
  prefixText: string;
  inlineRange: InlineRange;
  pattern: RegExp;
  undoManager: Y.UndoManager;
}) => ReturnType<KeyboardBindingHandler>;

export type InlineMarkdownMatch<
  AffineTextAttributes extends BaseTextAttributes = BaseTextAttributes,
> = {
  name: string;
  pattern: RegExp;
  action: InlineMarkdownMatchAction<AffineTextAttributes>;
};
