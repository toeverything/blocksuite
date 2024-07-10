import type { InlineEditor } from '../inline-editor.js';
import type { DeltaInsert, InlineRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import { intersectInlineRange } from '../utils/inline-range.js';

export class InlineTextService<TextAttributes extends BaseTextAttributes> {
  get yText() {
    return this.editor.yText;
  }

  readonly transact = this.editor.transact;

  constructor(readonly editor: InlineEditor<TextAttributes>) {}

  deleteText = (inlineRange: InlineRange): void => {
    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
    });
  };

  insertText = (
    inlineRange: InlineRange,
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void => {
    if (this.editor.attributeService.marks) {
      attributes = { ...attributes, ...this.editor.attributeService.marks };
    }
    const normalizedAttributes =
      this.editor.attributeService.normalizeAttributes(attributes);

    if (!text || !text.length) {
      throw new Error('text must not be empty');
    }

    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, text, normalizedAttributes);
    });
  };

  insertLineBreak = (inlineRange: InlineRange): void => {
    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, '\n');
    });
  };

  formatText = (
    inlineRange: InlineRange,
    attributes: TextAttributes,
    options: {
      match?: (delta: DeltaInsert, deltaInlineRange: InlineRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void => {
    const { match = () => true, mode = 'merge' } = options;
    const deltas = this.editor.deltaService.getDeltasByInlineRange(inlineRange);

    deltas
      .filter(([delta, deltaInlineRange]) => match(delta, deltaInlineRange))
      .forEach(([_delta, deltaInlineRange]) => {
        const normalizedAttributes =
          this.editor.attributeService.normalizeAttributes(attributes);
        if (!normalizedAttributes) return;

        const targetInlineRange = intersectInlineRange(
          inlineRange,
          deltaInlineRange
        );
        if (!targetInlineRange) return;

        if (mode === 'replace') {
          this.resetText(targetInlineRange);
        }

        this.transact(() => {
          this.yText.format(
            targetInlineRange.index,
            targetInlineRange.length,
            normalizedAttributes
          );
        });
      });
  };

  resetText = (inlineRange: InlineRange): void => {
    const coverDeltas: DeltaInsert[] = [];
    for (
      let i = inlineRange.index;
      i <= inlineRange.index + inlineRange.length;
      i++
    ) {
      const delta = this.editor.getDeltaByRangeIndex(i);
      if (delta) {
        coverDeltas.push(delta);
      }
    }

    const unset = Object.fromEntries(
      coverDeltas.flatMap(delta =>
        delta.attributes
          ? Object.keys(delta.attributes).map(key => [key, null])
          : []
      )
    );

    this.transact(() => {
      this.yText.format(inlineRange.index, inlineRange.length, {
        ...unset,
      });
    });
  };

  setText = (
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void => {
    this.transact(() => {
      this.yText.delete(0, this.yText.length);
      this.yText.insert(0, text, attributes);
    });
  };
}
