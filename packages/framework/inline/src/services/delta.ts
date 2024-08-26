import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { VLine } from '../index.js';
import type { InlineEditor } from '../inline-editor.js';
import type { DeltaInsert } from '../types.js';
import type { DeltaEntry, InlineRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/index.js';

import {
  deltaInsertsToChunks,
  transformDeltasToEmbedDeltas,
} from '../utils/index.js';
import { isInlineRangeIntersect } from '../utils/inline-range.js';

export class DeltaService<TextAttributes extends BaseTextAttributes> {
  /**
   * Here are examples of how this function computes and gets the delta.
   *
   * We have such a text:
   * ```
   * [
   *   {
   *      insert: 'aaa',
   *      attributes: { bold: true },
   *   },
   *   {
   *      insert: 'bbb',
   *      attributes: { italic: true },
   *   },
   * ]
   * ```
   *
   * `getDeltaByRangeIndex(0)` returns `{ insert: 'aaa', attributes: { bold: true } }`.
   *
   * `getDeltaByRangeIndex(1)` returns `{ insert: 'aaa', attributes: { bold: true } }`.
   *
   * `getDeltaByRangeIndex(3)` returns `{ insert: 'aaa', attributes: { bold: true } }`.
   *
   * `getDeltaByRangeIndex(4)` returns `{ insert: 'bbb', attributes: { italic: true } }`.
   */
  getDeltaByRangeIndex = (rangeIndex: number) => {
    const deltas = this.deltas;

    let index = 0;
    for (const delta of deltas) {
      if (index + delta.insert.length >= rangeIndex) {
        return delta;
      }
      index += delta.insert.length;
    }

    return null;
  };

  /**
   * Here are examples of how this function computes and gets the deltas.
   *
   * We have such a text:
   * ```
   * [
   *   {
   *      insert: 'aaa',
   *      attributes: { bold: true },
   *   },
   *   {
   *      insert: 'bbb',
   *      attributes: { italic: true },
   *   },
   *   {
   *      insert: 'ccc',
   *      attributes: { underline: true },
   *   },
   * ]
   * ```
   *
   * `getDeltasByInlineRange({ index: 0, length: 0 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
   * ```
   *
   * `getDeltasByInlineRange({ index: 0, length: 1 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
   * ```
   *
   * `getDeltasByInlineRange({ index: 0, length: 4 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   * `getDeltasByInlineRange({ index: 3, length: 1 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   * `getDeltasByInlineRange({ index: 3, length: 3 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   *  `getDeltasByInlineRange({ index: 3, length: 4 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }],
   *  [{ insert: 'ccc', attributes: { underline: true }, }, { index: 6, length: 3, }]]
   * ```
   */
  getDeltasByInlineRange = (
    inlineRange: InlineRange
  ): DeltaEntry<TextAttributes>[] => {
    return this.mapDeltasInInlineRange(
      inlineRange,
      (delta, index): DeltaEntry<TextAttributes> => [
        delta,
        { index, length: delta.insert.length },
      ]
    );
  };

  mapDeltasInInlineRange = <Result>(
    inlineRange: InlineRange,
    callback: (
      delta: DeltaInsert<TextAttributes>,
      rangeIndex: number,
      deltaIndex: number
    ) => Result
  ) => {
    const deltas = this.deltas;
    const result: Result[] = [];

    deltas.reduce((rangeIndex, delta, deltaIndex) => {
      const length = delta.insert.length;
      const from = inlineRange.index - length;
      const to = inlineRange.index + inlineRange.length;

      const deltaInRange =
        rangeIndex >= from &&
        (rangeIndex < to ||
          (inlineRange.length === 0 && rangeIndex === inlineRange.index));

      if (deltaInRange) {
        const value = callback(delta, rangeIndex, deltaIndex);
        result.push(value);
      }

      return rangeIndex + length;
    }, 0);

    return result;
  };

  // render current deltas to VLines
  render = async (syncInlineRange = true) => {
    if (!this.editor.mounted) return;

    this.editor.slots.render.emit();

    const rootElement = this.editor.rootElement;
    const chunks = deltaInsertsToChunks(this.deltas);

    let deltaIndex = 0;
    // every chunk is a line
    const lines = chunks.map((chunk, lineIndex) => {
      if (lineIndex > 0) {
        deltaIndex += 1; // for '\n'
      }

      if (chunk.length > 0) {
        const elements: VLine['elements'] = chunk.map(delta => {
          const startOffset = deltaIndex;
          deltaIndex += delta.insert.length;
          const endOffset = deltaIndex;

          const inlineRange = this.editor.getInlineRange();
          const selected =
            !!inlineRange &&
            isInlineRangeIntersect(inlineRange, {
              index: startOffset,
              length: endOffset - startOffset,
            });

          return [
            html`<v-element
              .selected=${selected}
              .delta=${{
                insert: delta.insert,
                attributes: this.editor.attributeService.normalizeAttributes(
                  delta.attributes
                ),
              }}
              .startOffset=${startOffset}
              .endOffset=${endOffset}
              .lineIndex=${lineIndex}
            ></v-element>`,
            delta,
          ];
        });

        return html`<v-line
          .elements=${elements}
          .index=${lineIndex}
        ></v-line>`;
      } else {
        return html`<v-line .elements=${[]} .index=${lineIndex}></v-line>`;
      }
    });

    try {
      render(
        repeat(
          lines.map((line, i) => ({ line, index: i })),
          entry => entry.index,
          entry => entry.line
        ),
        rootElement
      );
    } catch (_) {
      // Lit may be crashed by IME input and we need to rerender whole editor for it
      this.editor.rerenderWholeEditor();
      await this.editor.waitForUpdate();
    }

    await this.editor.waitForUpdate();

    if (syncInlineRange) {
      // We need to synchronize the selection immediately after rendering is completed,
      // otherwise there is a possibility of an error in the cursor position
      this.editor.rangeService.syncInlineRange();
    }

    this.editor.slots.renderComplete.emit();
  };

  constructor(readonly editor: InlineEditor<TextAttributes>) {}

  get deltas() {
    return transformDeltasToEmbedDeltas(this.editor, this.editor.yTextDeltas);
  }
}
