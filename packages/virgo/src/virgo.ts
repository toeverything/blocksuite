import type * as Y from 'yjs';
import { ZERO_WIDTH_SPACE } from './constant.js';
import { assertExists, Signal } from '@blocksuite/global/utils';
import type { DeltaInsert, TextAttributes, TextElement } from './types.js';
import { deltaInsersToChunks } from './utils/convert.js';
import { VirgoLine } from './components/virgo-line.js';
import { BaseText } from './components/base-text.js';
import { baseRenderElement } from './utils/render.js';

export interface VRange {
  index: number;
  length: number;
}

export type UpdateVRangeProp = [VRange | null, 'native' | 'input' | 'other'];

export type DeltaEntry = [DeltaInsert, VRange];

interface DomPoint {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}

export class VEditor {
  private _rootElement: HTMLElement | null = null;
  private _vRange: VRange | null = null;
  private _isComposing = false;
  private _isReadOnly = false;
  private _renderElement: (delta: DeltaInsert) => TextElement =
    baseRenderElement;

  signals: {
    updateVRange: Signal<UpdateVRangeProp>;
  };
  yText: Y.Text;

  constructor(
    yText: VEditor['yText'],
    renderElement?: (delta: DeltaInsert) => TextElement
  ) {
    this.yText = yText;
    if (renderElement) {
      this._renderElement = renderElement;
    }

    this.signals = {
      updateVRange: new Signal<UpdateVRangeProp>(),
    };

    document.addEventListener('selectionchange', this._onSelectionChange);

    yText.observe(this._onYTextChange);

    this.signals.updateVRange.on(this._onUpdateVRange);
  }

  mount(rootElement: HTMLElement): void {
    this._rootElement = rootElement;
    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.dataset.virgoRoot = 'true';

    const deltas = this.yText.toDelta() as DeltaInsert[];
    renderDeltas(deltas, this._rootElement, this._renderElement);

    this._rootElement.addEventListener(
      'beforeinput',
      this._onBefoeInput.bind(this)
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
      this._onCompositionStart.bind(this)
    );
    this._rootElement.addEventListener(
      'compositionend',
      this._onCompositionEnd.bind(this)
    );
  }

  getBaseElement(node: Node): TextElement | null {
    const element = node.parentElement?.closest('[data-virgo-element="true"]');

    if (element) {
      return element as TextElement;
    }

    return null;
  }

  getNativeSelection(): Selection | null {
    const selectionRoot = findDocumentOrShadowRoot(this);
    // @ts-ignore
    const selection = selectionRoot.getSelection();
    if (!selection) {
      return null;
    }

    if (selection.rangeCount === 0) {
      return null;
    }

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

  getDeltasByVRange(vRange: VRange): DeltaEntry[] {
    const deltas = this.yText.toDelta() as DeltaInsert[];

    const result: DeltaEntry[] = [];
    let index = 0;
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      if (
        index + delta.insert.length >= vRange.index &&
        index < vRange.index + vRange.length
      ) {
        result.push([delta, { index, length: delta.insert.length }]);
      }
      index += delta.insert.length;
    }

    return result;
  }

  getRootElement(): HTMLElement | null {
    return this._rootElement;
  }

  getVRange(): VRange | null {
    return this._vRange;
  }

  getReadOnly(): boolean {
    return this._isReadOnly;
  }

  setReadOnly(isReadOnly: boolean): void {
    this._isReadOnly = isReadOnly;
  }

  setVRange(vRange: VRange): void {
    this.signals.updateVRange.emit([vRange, 'other']);
  }

  deleteText(vRange: VRange): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
    });
  }

  // TODO add support for formatting
  insertText(vRange: VRange, text: string): void {
    const currentDelta = this.getDeltaByRangeIndex(vRange.index);

    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
      if (
        vRange.index > 0 &&
        currentDelta &&
        currentDelta.attributes.type !== 'line-break'
      ) {
        this.yText.insert(vRange.index, text, currentDelta.attributes);
      } else {
        this.yText.insert(vRange.index, text, { type: 'base' });
      }
    });
  }

  insertLineBreak(vRange: VRange): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
      this.yText.insert(vRange.index, '\n', { type: 'line-break' });
    });
  }

  formatText(
    vRange: VRange,
    attributes: TextAttributes,
    options: {
      match?: (delta: DeltaInsert, deltaVRange: VRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void {
    const { match = () => true, mode = 'replace' } = options;
    const deltas = this.getDeltasByVRange(vRange);

    for (const [delta, deltaVRange] of deltas) {
      if (delta.attributes.type === 'line-break') {
        continue;
      }

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
        Object.keys(delta.attributes).map(key => [key, null])
      )
    );

    this._transact(() => {
      this.yText.format(vRange.index, vRange.length, {
        ...unset,
        type: 'base',
      });
    });
  }

  /**
   * sync the dom selection from vRange for **this Editor**
   */
  syncVRange(): void {
    setTimeout(() => {
      if (this._vRange) {
        const newRange = this.toDomRange(this._vRange);

        if (newRange) {
          const selectionRoot = findDocumentOrShadowRoot(this);
          // @ts-ignore
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
      const textElements = Array.from(
        lineElements[i].querySelectorAll('[data-virgo-text="true"]')
      );

      for (let j = 0; j < textElements.length; j++) {
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

      // the one becasue of the line break
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
   *        the vRange of first Editor is null, the second is {index: 0, length: 5},
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

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) {
      return null;
    }

    let anchorText: Text | null = null;
    let anchorTextOffset = anchorOffset;
    let focusText: Text | null = null;
    let focusTextOffset = focusOffset;

    if (anchorNode instanceof Text && isVText(anchorNode)) {
      anchorText = anchorNode;
      anchorTextOffset = anchorOffset;
    }
    if (focusNode instanceof Text && isVText(focusNode)) {
      focusText = focusNode;
      focusTextOffset = focusOffset;
    }

    // case 1
    if (anchorText && focusText) {
      const anchorDomPoint = textPointToDomPoint(
        anchorText,
        anchorTextOffset,
        this._rootElement
      );
      const focusDomPoint = textPointToDomPoint(
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

    // case 2
    if (anchorText && !focusText) {
      const anchorDomPoint = textPointToDomPoint(
        anchorText,
        anchorTextOffset,
        this._rootElement
      );

      if (!anchorDomPoint) {
        return null;
      }

      if (isSelectionBackwards(selection)) {
        return {
          index: 0,
          length: anchorDomPoint.index,
        };
      } else {
        return {
          index: anchorDomPoint.index,
          length: anchorDomPoint.text.wholeText.length - anchorDomPoint.index,
        };
      }
    }

    // case 2
    if (!anchorText && focusText) {
      const focusDomPoint = textPointToDomPoint(
        focusText,
        focusTextOffset,
        this._rootElement
      );

      if (!focusDomPoint) {
        return null;
      }

      if (isSelectionBackwards(selection)) {
        return {
          index: focusDomPoint.index,
          length: focusDomPoint.text.wholeText.length - focusDomPoint.index,
        };
      } else {
        return {
          index: 0,
          length: focusDomPoint.index,
        };
      }
    }

    // case 3
    if (
      !anchorText &&
      !focusText &&
      selection.containsNode(this._rootElement)
    ) {
      return {
        index: 0,
        length: this.yText.length,
      };
    }

    return null;
  }

  private _onBefoeInput(event: InputEvent): void {
    event.preventDefault();

    if (this._isReadOnly) {
      return;
    }

    if (!this._vRange) {
      return;
    }

    const { inputType, data } = event;

    if (inputType === 'insertText' && this._vRange.index >= 0 && data) {
      this.insertText(this._vRange, data);

      this.signals.updateVRange.emit([
        {
          index: this._vRange.index + data.length,
          length: 0,
        },
        'input',
      ]);
    } else if (inputType === 'insertParagraph' && this._vRange.index >= 0) {
      this.insertLineBreak(this._vRange);

      this.signals.updateVRange.emit([
        {
          index: this._vRange.index + 1,
          length: 0,
        },
        'input',
      ]);
    } else if (
      inputType === 'deleteContentBackward' &&
      this._vRange.index >= 0
    ) {
      if (this._vRange.length > 0) {
        this.deleteText(this._vRange);

        this.signals.updateVRange.emit([
          {
            index: this._vRange.index,
            length: 0,
          },
          'input',
        ]);
      } else if (this._vRange.index > 0) {
        // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
        const tmpString = this.yText.toString().slice(0, this._vRange.index);
        const deletedChracater = [...tmpString].slice(-1).join('');
        this.deleteText({
          index: this._vRange.index - deletedChracater.length,
          length: deletedChracater.length,
        });

        this.signals.updateVRange.emit([
          {
            index: this._vRange.index - deletedChracater.length,
            length: 0,
          },
          'input',
        ]);
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

      this.signals.updateVRange.emit([
        {
          index: this._vRange.index + data.length,
          length: 0,
        },
        'input',
      ]);
    }
  }

  private _onYTextChange = () => {
    assertExists(this._rootElement);

    const deltas = (this.yText.toDelta() as DeltaInsert[]).flatMap(d => {
      if (d.attributes.type === 'line-break') {
        return d.insert
          .split('')
          .map(c => ({ insert: c, attributes: d.attributes }));
      }
      return d;
    }) as DeltaInsert[];

    renderDeltas(deltas, this._rootElement, this._renderElement);
  };

  private _onSelectionChange = () => {
    assertExists(this._rootElement);
    if (this._isComposing) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this);
    // @ts-ignore
    const selection = selectionRoot.getSelection();
    if (!selection) {
      return;
    }

    if (selection.rangeCount === 0) {
      return;
    }

    const { anchorNode, focusNode } = selection;

    if (
      !this._rootElement.contains(anchorNode) ||
      !this._rootElement.contains(focusNode)
    ) {
      return;
    }

    const vRange = this.toVRange(selection);
    if (vRange) {
      this.signals.updateVRange.emit([vRange, 'native']);
    }
  };

  private _onUpdateVRange = ([newRangStatic, origin]: UpdateVRangeProp) => {
    this._vRange = newRangStatic;

    if (origin === 'native') {
      return;
    }

    // avoid cursor jumping to beginning in a moment
    this._rootElement?.blur();

    const fn = () => {
      // when using input method _vRange will return to the starting point,
      // so we need to reassign
      this._vRange = newRangStatic;
      this.syncVRange();
    };

    // updates in lit are performed asynchronously
    setTimeout(fn, 0);
  };

  private _transact(fn: () => void): void {
    const doc = this.yText.doc;
    if (!doc) {
      throw new Error('yText is not attached to a doc');
    }

    doc.transact(fn, doc.clientID);
  }
}

function textPointToDomPoint(
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
    throw new Error('text is not in root element');
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
    spanElement = element.querySelector('span');
  }

  if (!spanElement) {
    return null;
  }

  const textNode = Array.from(spanElement.childNodes).find(
    node => node instanceof Text
  );

  if (textNode) {
    return textNode as Text;
  }
  return null;
}

function isVText(text: Text) {
  return text.parentElement?.dataset.virgoText === 'true' ?? false;
}

function findDocumentOrShadowRoot(editor: VEditor): Document | ShadowRoot {
  const el = editor.getRootElement();

  if (!el) {
    throw new Error('editor root element not found');
  }

  const root = el.getRootNode();

  if (
    (root instanceof Document || root instanceof ShadowRoot) &&
    // @ts-ignore
    root.getSelection != null
  ) {
    return root;
  }

  return el.ownerDocument;
}

function renderDeltas(
  deltas: DeltaInsert[],
  rootElement: HTMLElement,
  render: (delta: DeltaInsert) => TextElement
) {
  const chunks = deltaInsersToChunks(deltas);

  // every chunk is a line
  const lines: VirgoLine[] = [];
  for (const chunk of chunks) {
    if (chunk.length === 0) {
      const virgoLine = new VirgoLine();

      virgoLine.elements.push(new BaseText());
      lines.push(virgoLine);
    } else {
      const virgoLine = new VirgoLine();
      for (const delta of chunk) {
        const element = render(delta);

        virgoLine.elements.push(element);
      }

      lines.push(virgoLine);
    }
  }

  rootElement.replaceChildren(...lines);
}
