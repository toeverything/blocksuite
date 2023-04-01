import type { z, ZodTypeDef } from 'zod';

import type { AttributeRenderer } from '../types.js';
import type { VRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/index.js';
import {
  baseTextAttributes,
  getDefaultAttributeRenderer,
} from '../utils/index.js';
import type { VEditor } from '../virgo.js';

export class VirgoAttributeService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  private _marks: TextAttributes | null = null;

  private _attributeRenderer: AttributeRenderer<TextAttributes> =
    getDefaultAttributeRenderer<TextAttributes>();

  private _attributeSchema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown> =
    baseTextAttributes as z.ZodSchema<TextAttributes, ZodTypeDef, unknown>;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  get marks() {
    return this._marks;
  }

  get attributeRenderer() {
    return this._attributeRenderer;
  }

  setMarks = (marks: TextAttributes): void => {
    this._marks = marks;
  };

  resetMarks = (): void => {
    this._marks = null;
  };

  setAttributeSchema = (
    schema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown>
  ) => {
    this._attributeSchema = schema;
  };

  setAttributeRenderer = (renderer: AttributeRenderer<TextAttributes>) => {
    this._attributeRenderer = renderer;
  };

  getFormat = (vRange: VRange, loose = false): TextAttributes => {
    const deltas = this._editor.deltaService
      .getDeltasByVRange(vRange)
      .filter(
        ([delta, position]) =>
          position.index + position.length > vRange.index &&
          position.index <= vRange.index + vRange.length
      );
    const maybeAttributesArray = deltas.map(([delta]) => delta.attributes);
    if (loose) {
      return maybeAttributesArray.reduce(
        (acc, cur) => ({ ...acc, ...cur }),
        {}
      ) as TextAttributes;
    }
    if (
      !maybeAttributesArray.length ||
      // some text does not have any attributes
      maybeAttributesArray.some(attributes => !attributes)
    ) {
      return {} as TextAttributes;
    }
    const attributesArray = maybeAttributesArray as TextAttributes[];
    return attributesArray.reduce((acc, cur) => {
      const newFormat = {} as TextAttributes;
      for (const key in acc) {
        const typedKey = key as keyof TextAttributes;
        // If the given range contains multiple different formats
        // such as links with different values,
        // we will treat it as having no format
        if (acc[typedKey] === cur[typedKey]) {
          // This cast is secure because we have checked that the value of the key is the same.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newFormat[typedKey] = acc[typedKey] as any;
        }
      }
      return newFormat;
    });
  };

  normalizeAttributes = (textAttributes?: TextAttributes) => {
    if (!textAttributes) {
      return undefined;
    }
    const attributeResult = this._attributeSchema.safeParse(textAttributes);
    if (!attributeResult.success) {
      console.error(attributeResult.error);
      return undefined;
    }
    return Object.fromEntries(
      // filter out undefined values
      Object.entries(attributeResult.data).filter(([k, v]) => v)
    ) as TextAttributes;
  };
}
