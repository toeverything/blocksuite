import type { TemplateResult } from 'lit';
import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { DeltaInsert } from '../types.js';
import type { DeltaEntry, VRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/index.js';
import { deltaInsertsToChunks, renderElement } from '../utils/index.js';
import type { VEditor } from '../virgo.js';

export class VirgoDeltaService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  get deltas() {
    return this._editor.yText.toDelta() as DeltaInsert<TextAttributes>[];
  }

  mapDeltasInVRange = <Result>(
    vRange: VRange,
    callback: (delta: DeltaInsert<TextAttributes>, index: number) => Result
  ) => {
    const deltas = this.deltas;
    const result: Result[] = [];

    deltas.reduce((index, delta) => {
      const length = delta.insert.length;
      const from = vRange.index - length;
      const to = vRange.index + vRange.length;

      const deltaInRange =
        index >= from &&
        (index < to || (vRange.length === 0 && index === vRange.index));

      if (deltaInRange) {
        const value = callback(delta, index);
        result.push(value);
      }

      return index + length;
    }, 0);

    return result;
  };

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
   * `getDeltasByVRange({ index: 0, length: 0 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
   * ```
   *
   * `getDeltasByVRange({ index: 0, length: 1 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }]]
   * ```
   *
   * `getDeltasByVRange({ index: 0, length: 4 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   * `getDeltasByVRange({ index: 3, length: 1 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   * `getDeltasByVRange({ index: 3, length: 3 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }]]
   * ```
   *
   *  `getDeltasByVRange({ index: 3, length: 4 })` returns
   * ```
   * [{ insert: 'aaa', attributes: { bold: true }, }, { index: 0, length: 3, }],
   *  [{ insert: 'bbb', attributes: { italic: true }, }, { index: 3, length: 3, }],
   *  [{ insert: 'ccc', attributes: { underline: true }, }, { index: 6, length: 3, }]]
   * ```
   */
  getDeltasByVRange = (vRange: VRange): DeltaEntry<TextAttributes>[] => {
    return this.mapDeltasInVRange(
      vRange,
      (delta, index): DeltaEntry<TextAttributes> => [
        delta,
        { index, length: delta.insert.length },
      ]
    );
  };

  // render current deltas to VLines
  render = async () => {
    const rootElement = this._editor.rootElement;

    const deltas = this.deltas;
    const chunks = deltaInsertsToChunks(deltas);

    // every chunk is a line
    const lines = chunks.map(chunk => {
      const elementTs: TemplateResult<1>[] = [];
      if (chunk.length === 0) {
        elementTs.push(html`<v-element></v-element>`);
      } else {
        chunk.forEach(delta => {
          const element = renderElement(
            delta,
            this._editor.attributeService.normalizeAttributes,
            this._editor.attributeService.attributeRenderer
          );

          elementTs.push(element);
        });
      }

      return html`<v-line .elements=${elementTs}></v-line>`;
    });

    render(
      repeat(
        lines.map((line, i) => ({ line, index: i })),
        entry => entry.index,
        entry => entry.line
      ),
      rootElement
    );

    const vLines = Array.from(rootElement.querySelectorAll('v-line'));
    await Promise.all(vLines.map(line => line.updateComplete));

    this._editor.slots.updated.emit();
  };
}
