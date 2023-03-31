import type { z, ZodTypeDef } from 'zod';

import type { AttributesRenderer } from '../types.js';
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

  private _attributesRenderer: AttributesRenderer<TextAttributes> =
    getDefaultAttributeRenderer<TextAttributes>();

  private _attributesSchema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown> =
    baseTextAttributes as z.ZodSchema<TextAttributes, ZodTypeDef, unknown>;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  get marks() {
    return this._marks;
  }

  get attributesRenderer() {
    return this._attributesRenderer;
  }

  setMarks = (marks: TextAttributes): void => {
    this._marks = marks;
  };

  resetMarks = (): void => {
    this._marks = null;
  };

  setAttributesSchema = (
    schema: z.ZodSchema<TextAttributes, ZodTypeDef, unknown>
  ) => {
    this._attributesSchema = schema;
  };

  setAttributesRenderer = (renderer: AttributesRenderer<TextAttributes>) => {
    this._attributesRenderer = renderer;
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
    const attributesResult = this._attributesSchema.safeParse(textAttributes);
    if (!attributesResult.success) {
      console.error(attributesResult.error);
      return undefined;
    }
    return Object.fromEntries(
      // filter out undefined values
      Object.entries(attributesResult.data).filter(([k, v]) => v)
    ) as TextAttributes;
  };
}
