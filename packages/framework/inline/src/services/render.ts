import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import * as Y from 'yjs';

import type { VLine } from '../components/v-line.js';
import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';

import { deltaInsertsToChunks } from '../utils/delta-convert.js';
import { isInlineRangeIntersect } from '../utils/inline-range.js';

export class RenderService<TextAttributes extends BaseTextAttributes> {
  private _onYTextChange = (_: Y.YTextEvent, transaction: Y.Transaction) => {
    this.editor.slots.textChange.emit();

    const yText = this.editor.yText;

    if (yText.toString().includes('\r')) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
        'yText must not contain "\\r" because it will break the range synchronization'
      );
    }

    this.render();

    const inlineRange = this.editor.inlineRange$.peek();
    if (!inlineRange || transaction.local) return;

    const lastStartRelativePosition = this.editor.lastStartRelativePosition;
    const lastEndRelativePosition = this.editor.lastEndRelativePosition;
    if (!lastStartRelativePosition || !lastEndRelativePosition) return;

    const doc = this.editor.yText.doc;
    assertExists(doc);
    const absoluteStart = Y.createAbsolutePositionFromRelativePosition(
      lastStartRelativePosition,
      doc
    );
    const absoluteEnd = Y.createAbsolutePositionFromRelativePosition(
      lastEndRelativePosition,
      doc
    );

    const startIndex = absoluteStart?.index;
    const endIndex = absoluteEnd?.index;
    if (!startIndex || !endIndex) return;

    const newInlineRange: InlineRange = {
      index: startIndex,
      length: endIndex - startIndex,
    };
    if (!this.editor.isValidInlineRange(newInlineRange)) return;

    this.editor.setInlineRange(newInlineRange);
    this.editor.syncInlineRange();
  };

  mount = () => {
    const editor = this.editor;
    const yText = editor.yText;

    yText.observe(this._onYTextChange);
    editor.disposables.add({
      dispose: () => {
        yText.unobserve(this._onYTextChange);
      },
    });
  };

  // render current deltas to VLines
  render = () => {
    if (!this.editor.mounted) return;
    console.trace(
      'render start',
      this.editor.rootElement.innerText,
      this.editor.yTextString
    );
    const rootElement = this.editor.rootElement;
    const embedDeltas = this.editor.deltaService.embedDeltas;
    const chunks = deltaInsertsToChunks(embedDeltas);

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
    }

    this.editor
      .waitForUpdate()
      .then(() => {
        console.log(
          'render end',
          this.editor.rootElement.innerText,
          this.editor.yTextString
        );
        this.editor.slots.renderComplete.emit();
      })
      .catch(console.error);
  };

  rerenderWholeEditor = () => {
    const rootElement = this.editor.rootElement;

    if (!rootElement.isConnected) return;

    rootElement.replaceChildren();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (rootElement as any)['_$litPart$'];
    this.render();
  };

  waitForUpdate = async () => {
    const vLines = Array.from(
      this.editor.rootElement.querySelectorAll('v-line')
    );
    await Promise.all(vLines.map(line => line.updateComplete));
  };

  constructor(readonly editor: InlineEditor<TextAttributes>) {}
}
