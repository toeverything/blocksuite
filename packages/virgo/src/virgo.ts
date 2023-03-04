import { assertExists, Slot } from '@blocksuite/global/utils';
import type * as Y from 'yjs';
import type { z } from 'zod';

import { VirgoLine } from './components/virgo-line.js';
import { VirgoText } from './components/virgo-text.js';
import { ZERO_WIDTH_SPACE } from './constant.js';
import type { AttributesRenderer, DeltaInsert } from './types.js';
import { getDefaultAttributeRenderer } from './utils/attributes-renderer.js';
import { deltaInsertsToChunks } from './utils/convert.js';
import type { BaseTextAttributes } from './utils/index.js';
import { baseTextAttributes } from './utils/index.js';
import { renderElement } from './utils/render.js';

export interface VRange {
  index: number;
  length: number;
}

export type UpdateVRangeProp = [VRange | null, 'native' | 'input' | 'other'];

export type DeltaEntry = [DeltaInsert, VRange];

// corresponding to [anchorNode/focusNode, anchorOffset/focusOffset]
export type NativePoint = readonly [node: Node, offset: number];
// the number here is relative to the text node
export type TextPoint = readonly [text: Text, offset: number];
export interface DomPoint {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}

export class VEditor<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> {
  static nativePointToTextPoint(
    node: unknown,
    offset: number
  ): TextPoint | null {
    let text: Text | null = null;
    let textOffset = offset;
    if (isVText(node)) {
      text = node;
      textOffset = offset;
    } else if (isVElement(node)) {
      const textNode = getTextNodeFromElement(node);
      if (textNode) {
        text = textNode;
        textOffset = offset;
      }
    } else if (isVLine(node)) {
      const firstTextElement = node.querySelector('v-text');
      if (firstTextElement) {
        const textNode = getTextNodeFromElement(firstTextElement);
        if (textNode) {
          text = textNode;
          textOffset = 0;
        }
      }
    }

    if (!text) {
      return null;
    }

    return [text, textOffset] as const;
  }

  static textPointToDomPoint(
    text: Text,
    offset: number,
    rootElement: HTMLElement
  ): DomPoint | null {
    if (rootElement.dataset.virgoRoot !== 'true') {
      throw new Error(
        'textRangeToDomPoint should be called with editor root element'
      );
    }

    if (!rootElement.contains(text)) {
      return null;
    }

    const textNodes = Array.from(
      rootElement.querySelectorAll('[data-virgo-text="true"]')
    ).map(textElement => getTextNodeFromElement(textElement));
    const goalIndex = textNodes.indexOf(text);
    let index = 0;
    for (const textNode of textNodes.slice(0, goalIndex)) {
      if (!textNode) {
        return null;
      }

      index += calculateTextLength(textNode);
    }

    if (text.wholeText !== ZERO_WIDTH_SPACE) {
      index += offset;
    }

    const textElement = text.parentElement;
    if (!textElement) {
      throw new Error('text element not found');
    }

    const lineElement = textElement.closest('virgo-line');

    if (!lineElement) {
      throw new Error('line element not found');
    }

    const lineIndex = Array.from(
      rootElement.querySelectorAll('virgo-line')
    ).indexOf(lineElement);

    return { text, index: index + lineIndex };
  }

  private _rootElement: HTMLElement | null = null;
  private _mountAbort: AbortController | null = null;
  private _handlerAbort: AbortController | null = null;
  private _vRange: VRange | null = null;
  private _isComposing = false;
  private _isReadOnly = false;
  private _yText: Y.Text;

  private _attributesRenderer: AttributesRenderer<TextAttributes> =
    getDefaultAttributeRenderer<TextAttributes>();

  private _attributesSchema: z.ZodSchema<TextAttributes> =
    baseTextAttributes as z.ZodSchema<TextAttributes>;

  private _handlers: {
    keydown?: (event: KeyboardEvent) => void;
    paste?: (event: ClipboardEvent) => void;
  } = {};

  private _parseSchema = (textAttributes?: TextAttributes) => {
    return this._attributesSchema.optional().parse(textAttributes);
  };

  private _renderDeltas = () => {
    assertExists(this._rootElement);

    const deltas = this.yText.toDelta() as DeltaInsert<TextAttributes>[];
    const chunks = deltaInsertsToChunks(deltas);

    // every chunk is a line
    const lines = chunks.map(chunk => {
      const virgoLine = new VirgoLine<TextAttributes>();

      if (chunk.length === 0) {
        virgoLine.elements.push(new VirgoText());
      } else {
        chunk.forEach(delta => {
          const element = renderElement(
            delta,
            this._parseSchema,
            this._attributesRenderer
          );

          virgoLine.elements.push(element);
        });
      }

      return virgoLine;
    });

    this._rootElement.replaceChildren(...lines);
  };

  slots: {
    updateVRange: Slot<UpdateVRangeProp>;
  };

  get yText() {
    return this._yText;
  }

  get rootElement() {
    assertExists(this._rootElement);
    return this._rootElement;
  }

  constructor(yText: VEditor['yText']) {
    if (!yText.doc) {
      throw new Error('yText must be attached to a Y.Doc');
    }

    this._yText = yText;

    this.slots = {
      updateVRange: new Slot<UpdateVRangeProp>(),
    };

    this.slots.updateVRange.on(this._onUpdateVRange);
  }

  setAttributesSchema = (schema: z.ZodSchema<TextAttributes>) => {
    this._attributesSchema = schema;
  };

  setAttributesRenderer = (renderer: AttributesRenderer<TextAttributes>) => {
    this._attributesRenderer = renderer;
  };

  bindHandlers(
    handlers: VEditor['_handlers'] = {
      paste: (event: ClipboardEvent) => {
        const data = event.clipboardData?.getData('text/plain');
        if (data) {
          const vRange = this._vRange;
          if (vRange) {
            this.insertText(vRange, data);
            this.signals.updateVRange.emit([
              {
                index: vRange.index + data.length,
                length: 0,
              },
              'input',
            ]);
          }
        }
      },
    }
  ) {
    this._handlers = handlers;

    if (this._handlerAbort) {
      this._handlerAbort.abort();
    }

    this._handlerAbort = new AbortController();

    assertExists(this._rootElement, 'you need to mount the editor first');
    if (this._handlers.paste) {
      this._rootElement.addEventListener('paste', this._handlers.paste, {
        signal: this._handlerAbort.signal,
      });
    }

    if (this._handlers.keydown) {
      this._rootElement.addEventListener('keydown', this._handlers.keydown, {
        signal: this._handlerAbort.signal,
      });
    }
  }

  mount(rootElement: HTMLElement): void {
    this._rootElement = rootElement;
    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.dataset.virgoRoot = 'true';
    this.yText.observe(this._onYTextChange);
    document.addEventListener('selectionchange', this._onSelectionChange);

    this._mountAbort = new AbortController();

    this._renderDeltas();

    this._rootElement.addEventListener(
      'beforeinput',
      this._onBeforeInput.bind(this),
      {
        signal: this._mountAbort.signal,
      }
    );
    this._rootElement
      .querySelectorAll('[data-virgo-text="true"]')
      .forEach(textNode => {
        textNode.addEventListener('dragstart', event => {
          event.preventDefault();
        });
      });

    this._rootElement.addEventListener(
      'compositionstart',
      this._onCompositionStart.bind(this),
      {
        signal: this._mountAbort.signal,
      }
    );
    this._rootElement.addEventListener(
      'compositionend',
      this._onCompositionEnd.bind(this),
      {
        signal: this._mountAbort.signal,
      }
    );
  }

  unmount(): void {
    document.removeEventListener('selectionchange', this._onSelectionChange);
    if (this._mountAbort) {
      this._mountAbort.abort();
      this._mountAbort = null;
    }

    if (this._handlerAbort) {
      this._handlerAbort.abort();
      this._handlerAbort = null;
    }

    this._rootElement?.replaceChildren();

    this._rootElement = null;
  }

  getNativeSelection(): Selection | null {
    const selectionRoot = findDocumentOrShadowRoot(this);
    const selection = selectionRoot.getSelection();
    if (!selection) return null;
    if (selection.rangeCount === 0) return null;

    return selection;
  }

  getDeltaByRangeIndex(rangeIndex: VRange['index']): DeltaInsert | null {
    const deltas = this.yText.toDelta() as DeltaInsert[];

    let index = 0;
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      if (index + delta.insert.length >= rangeIndex) {
        return delta;
      }
      index += delta.insert.length;
    }

    return null;
  }

  getTextPoint(rangeIndex: VRange['index']): TextPoint {
    assertExists(this._rootElement);
    const textElements = Array.from(
      this._rootElement.querySelectorAll('[data-virgo-text="true"]')
    );

    let index = 0;
    for (const textElement of textElements) {
      if (!textElement.textContent) {
        throw new Error('text element should have textContent');
      }
      if (index + textElement.textContent.length >= rangeIndex) {
        const text = getTextNodeFromElement(textElement);
        if (!text) {
          throw new Error('text node should have text content');
        }
        return [text, rangeIndex - index];
      }
      index += textElement.textContent.length;
    }

    throw new Error('failed to find leaf');
  }

  // the number is releated to the VirgoLine's textLength
  getLine(rangeIndex: VRange['index']): readonly [VirgoLine, number] {
    assertExists(this._rootElement);
    const lineElements = Array.from(
      this._rootElement.querySelectorAll('virgo-line')
    );

    let index = 0;
    for (const lineElement of lineElements) {
      if (rangeIndex >= index && rangeIndex < index + lineElement.textLength) {
        return [lineElement, rangeIndex - index] as const;
      }
      if (
        rangeIndex === index + lineElement.textLength &&
        rangeIndex === this.yText.length
      ) {
        return [lineElement, rangeIndex - index] as const;
      }
      index += lineElement.textLength + 1;
    }

    throw new Error('failed to find line');
  }

  getDeltasByVRange(vRange: VRange): DeltaEntry[] {
    const deltas = this.yText.toDelta() as DeltaInsert[];

    const result: DeltaEntry[] = [];
    let index = 0;
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      if (
        index + delta.insert.length >= vRange.index &&
        (index < vRange.index + vRange.length ||
          (vRange.length === 0 && index === vRange.index))
      ) {
        result.push([delta, { index, length: delta.insert.length }]);
      }
      index += delta.insert.length;
    }

    return result;
  }

  getVRange(): VRange | null {
    return this._vRange;
  }

  getReadOnly(): boolean {
    return this._isReadOnly;
  }

  getFormat(vRange: VRange): TextAttributes {
    const deltas = this.getDeltasByVRange(vRange);

    const result: {
      [key: string]: unknown;
    } = {};
    for (const [delta] of deltas) {
      if (delta.attributes) {
        for (const [key, value] of Object.entries(delta.attributes)) {
          if (typeof value === 'boolean' && !value) {
            delete result[key];
          } else {
            result[key] = value;
          }
        }
      }
    }

    return result as TextAttributes;
  }

  setReadOnly(isReadOnly: boolean): void {
    this._isReadOnly = isReadOnly;
  }

  setVRange(vRange: VRange): void {
    this.slots.updateVRange.emit([vRange, 'other']);
  }

  focusEnd(): void {
    this.setVRange({
      index: this.yText.length,
      length: 0,
    });

    this.syncVRange();
  }

  deleteText(vRange: VRange): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
    });
  }

  insertText(vRange: VRange, text: string): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
      this.yText.insert(vRange.index, text, {});
    });
  }

  insertLineBreak(vRange: VRange): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
      this.yText.insert(vRange.index, '\n');
    });
  }

  formatText(
    vRange: VRange,
    attributes: Partial<
      Record<keyof TextAttributes, TextAttributes[keyof TextAttributes] | null>
    >,
    options: {
      match?: (delta: DeltaInsert, deltaVRange: VRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void {
    const { match = () => true, mode = 'merge' } = options;
    const deltas = this.getDeltasByVRange(vRange);

    for (const [delta, deltaVRange] of deltas) {
      if (match(delta, deltaVRange)) {
        const targetVRange = {
          index: Math.max(vRange.index, deltaVRange.index),
          length:
            Math.min(
              vRange.index + vRange.length,
              deltaVRange.index + deltaVRange.length
            ) - Math.max(vRange.index, deltaVRange.index),
        };

        if (mode === 'replace') {
          this.resetText(targetVRange);
        }

        this._transact(() => {
          this.yText.format(
            targetVRange.index,
            targetVRange.length,
            attributes
          );
        });
      }
    }
  }

  resetText(vRange: VRange): void {
    const coverDeltas: DeltaInsert[] = [];
    for (let i = vRange.index; i <= vRange.index + vRange.length; i++) {
      const delta = this.getDeltaByRangeIndex(i);
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

    this._transact(() => {
      this.yText.format(vRange.index, vRange.length, {
        ...unset,
      });
    });
  }

  /**
   * sync the dom selection from vRange for **this Editor**
   */
  syncVRange(): void {
    requestAnimationFrame(() => {
      if (this._vRange) {
        const newRange = this.toDomRange(this._vRange);

        if (newRange) {
          const selectionRoot = findDocumentOrShadowRoot(this);
          const selection = selectionRoot.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    });
  }

  /**
   * calculate the dom selection from vRange for **this Editor**
   */
  toDomRange(vRange: VRange): Range | null {
    assertExists(this._rootElement);

    const lineElements = Array.from(
      this._rootElement.querySelectorAll('virgo-line')
    );

    // calculate anchorNode and focusNode
    let anchorText: Text | null = null;
    let focusText: Text | null = null;
    let anchorOffset = 0;
    let focusOffset = 0;
    let index = 0;

    for (let i = 0; i < lineElements.length; i++) {
      if (anchorText && focusText) {
        break;
      }

      const textElements = Array.from(
        lineElements[i].querySelectorAll('[data-virgo-text="true"]')
      );

      for (let j = 0; j < textElements.length; j++) {
        if (anchorText && focusText) {
          break;
        }

        const textNode = getTextNodeFromElement(textElements[j]);
        if (!textNode) {
          return null;
        }

        const textLength = calculateTextLength(textNode);

        if (!anchorText && index + textLength >= vRange.index) {
          anchorText = textNode;
          anchorOffset = vRange.index - index;
        }
        if (!focusText && index + textLength >= vRange.index + vRange.length) {
          focusText = textNode;
          focusOffset = vRange.index + vRange.length - index;
        }

        index += textLength;
      }

      // the one because of the line break
      index += 1;
    }

    if (!anchorText || !focusText) {
      return null;
    }

    const range = document.createRange();
    range.setStart(anchorText, anchorOffset);
    range.setEnd(focusText, focusOffset);
    return range;
  }

  /**
   * calculate the vRange from dom selection for **this Editor**
   * there are three cases when the vRange of this Editor is not null:
   * (In the following, "|" mean anchor and focus, each line is a separate Editor)
   * 1. anchor and focus are in this Editor
   *    aaaaaa
   *    b|bbbb|b
   *    cccccc
   *    the vRange of second Editor is {index: 1, length: 4}, the others are null
   * 2. anchor and focus one in this Editor, one in another Editor
   *    aaa|aaa    aaaaaa
   *    bbbbb|b or bbbbb|b
   *    cccccc     cc|cccc
   *    2.1
   *        the vRange of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
   *        the third is null
   *    2.2
   *        the vRange of first Editor is null, the second is {index: 5, length: 1},
   *        the third is {index: 0, length: 2}
   * 3. anchor and focus are in another Editor
   *    aa|aaaa
   *    bbbbbb
   *    cccc|cc
   *    the vRange of first Editor is {index: 2, length: 4},
   *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
   */
  toVRange(selection: Selection): VRange | null {
    assertExists(this._rootElement);
    const root = this._rootElement;

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) {
      return null;
    }

    const anchorTextPoint = VEditor.nativePointToTextPoint(
      anchorNode,
      anchorOffset
    );
    const focusTextPoint = VEditor.nativePointToTextPoint(
      focusNode,
      focusOffset
    );

    if (!anchorTextPoint || !focusTextPoint) {
      return null;
    }

    const [anchorText, anchorTextOffset] = anchorTextPoint;
    const [focusText, focusTextOffset] = focusTextPoint;

    // case 1
    if (root.contains(anchorText) && root.contains(focusText)) {
      const anchorDomPoint = VEditor.textPointToDomPoint(
        anchorText,
        anchorTextOffset,
        this._rootElement
      );
      const focusDomPoint = VEditor.textPointToDomPoint(
        focusText,
        focusTextOffset,
        this._rootElement
      );

      if (!anchorDomPoint || !focusDomPoint) {
        return null;
      }

      return {
        index: Math.min(anchorDomPoint.index, focusDomPoint.index),
        length: Math.abs(anchorDomPoint.index - focusDomPoint.index),
      };
    }

    // case 2.1
    if (!root.contains(anchorText) && root.contains(focusText)) {
      if (isSelectionBackwards(selection)) {
        const anchorDomPoint = VEditor.textPointToDomPoint(
          anchorText,
          anchorTextOffset,
          this._rootElement
        );

        if (!anchorDomPoint) {
          return null;
        }

        return {
          index: anchorDomPoint.index,
          length: this.yText.length - anchorDomPoint.index,
        };
      } else {
        const focusDomPoint = VEditor.textPointToDomPoint(
          focusText,
          focusTextOffset,
          this._rootElement
        );

        if (!focusDomPoint) {
          return null;
        }

        return {
          index: 0,
          length: focusDomPoint.index,
        };
      }
    }

    // case 2.2
    if (root.contains(anchorText) && !root.contains(focusText)) {
      if (isSelectionBackwards(selection)) {
        const focusDomPoint = VEditor.textPointToDomPoint(
          focusText,
          focusTextOffset,
          this._rootElement
        );

        if (!focusDomPoint) {
          return null;
        }

        return {
          index: 0,
          length: focusDomPoint.index,
        };
      } else {
        const anchorDomPoint = VEditor.textPointToDomPoint(
          anchorText,
          anchorTextOffset,
          this._rootElement
        );

        if (!anchorDomPoint) {
          return null;
        }

        return {
          index: anchorDomPoint.index,
          length: this.yText.length - anchorDomPoint.index,
        };
      }
    }

    // case 3
    if (!root.contains(anchorText) && !root.contains(focusText)) {
      return {
        index: 0,
        length: this.yText.length,
      };
    }

    return null;
  }

  private _onBeforeInput(event: InputEvent): void {
    event.preventDefault();

    if (this._isReadOnly) {
      return;
    }

    if (!this._vRange) {
      return;
    }

    const { inputType, data } = event;
    const currentVRange = this._vRange;

    if (inputType === 'insertText' && currentVRange.index >= 0 && data) {
      this.slots.updateVRange.emit([
        {
          index: currentVRange.index + data.length,
          length: 0,
        },
        'input',
      ]);

      this.insertText(currentVRange, data);
    } else if (inputType === 'insertParagraph' && currentVRange.index >= 0) {
      this.slots.updateVRange.emit([
        {
          index: currentVRange.index + 1,
          length: 0,
        },
        'input',
      ]);

      this.insertLineBreak(currentVRange);
    } else if (
      inputType === 'deleteContentBackward' &&
      currentVRange.index >= 0
    ) {
      if (currentVRange.length > 0) {
        this.slots.updateVRange.emit([
          {
            index: currentVRange.index,
            length: 0,
          },
          'input',
        ]);

        this.deleteText(currentVRange);
      } else if (currentVRange.index > 0) {
        // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
        const tmpString = this.yText.toString().slice(0, currentVRange.index);
        const deletedCharacter = [...tmpString].slice(-1).join('');
        this.slots.updateVRange.emit([
          {
            index: currentVRange.index - deletedCharacter.length,
            length: 0,
          },
          'input',
        ]);

        this.deleteText({
          index: currentVRange.index - deletedCharacter.length,
          length: deletedCharacter.length,
        });
      }
    }
  }

  private _onCompositionStart(): void {
    this._isComposing = true;
  }

  private _onCompositionEnd(event: CompositionEvent): void {
    this._isComposing = false;

    if (!this._vRange) {
      return;
    }

    const { data } = event;

    if (this._vRange.index >= 0 && data) {
      this.insertText(this._vRange, data);

      this.slots.updateVRange.emit([
        {
          index: this._vRange.index + data.length,
          length: 0,
        },
        'input',
      ]);
    }
  }

  private _onYTextChange = () => {
    Promise.resolve().then(() => {
      assertExists(this._rootElement);

      this._renderDeltas();
    });
  };

  private _onSelectionChange = () => {
    assertExists(this._rootElement);
    if (this._isComposing) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this);
    const selection = selectionRoot.getSelection();
    if (!selection) return;
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range || !range.intersectsNode(this._rootElement)) return;

    const vRange = this.toVRange(selection);
    if (vRange) {
      this.slots.updateVRange.emit([vRange, 'native']);
    }
  };

  private _onUpdateVRange = ([newVRange, origin]: UpdateVRangeProp) => {
    this._vRange = newVRange;

    if (origin === 'native') {
      return;
    }

    // avoid cursor jumping to beginning in a moment
    this._rootElement?.blur();

    const fn = () => {
      if (!newVRange) {
        return;
      }

      // when using input method _vRange will return to the starting point,
      // so we need to resync
      const newRange = this.toDomRange(newVRange);
      if (newRange) {
        const selectionRoot = findDocumentOrShadowRoot(this);
        const selection = selectionRoot.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    };

    // updates in lit are performed asynchronously
    requestAnimationFrame(fn);
  };

  private _transact(fn: () => void): void {
    const doc = this.yText.doc;
    if (!doc) {
      throw new Error('yText is not attached to a doc');
    }

    doc.transact(fn, doc.clientID);
  }
}

function isSelectionBackwards(selection: Selection): boolean {
  let backwards = false;
  if (!selection.isCollapsed && selection.anchorNode && selection.focusNode) {
    const range = document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    backwards = range.collapsed;
    range.detach();
  }
  return backwards;
}

function calculateTextLength(text: Text): number {
  if (text.wholeText === ZERO_WIDTH_SPACE) {
    return 0;
  } else {
    return text.wholeText.length;
  }
}

function getTextNodeFromElement(element: Element): Text | null {
  let spanElement: Element | null = element;
  if (element instanceof HTMLElement && element.dataset.virgoText === 'true') {
    spanElement = element;
  } else {
    spanElement = element.querySelector('[data-virgo-text="true"]');
  }

  if (!spanElement) {
    return null;
  }

  const textNode = Array.from(spanElement.childNodes).find(
    (node): node is Text => node instanceof Text
  );

  if (textNode) {
    return textNode;
  }
  return null;
}

function isVText(text: unknown): text is Text {
  return (
    text instanceof Text &&
    (text.parentElement?.dataset.virgoText === 'true' ?? false)
  );
}

function isVElement(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.dataset.virgoElement === 'true'
  );
}

function isVLine(element: unknown): element is HTMLElement {
  return (
    element instanceof HTMLElement && element.parentElement instanceof VirgoLine
  );
}

function findDocumentOrShadowRoot<TextAttributes extends BaseTextAttributes>(
  editor: VEditor<TextAttributes>
): Document {
  const el = editor.rootElement;

  if (!el) {
    throw new Error('editor root element not found');
  }

  const root = el.getRootNode();

  if (
    (root instanceof Document || root instanceof ShadowRoot) &&
    'getSelection' in root
  ) {
    return root;
  }

  return el.ownerDocument;
}
