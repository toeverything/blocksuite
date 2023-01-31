import type * as Y from 'yjs';
import { ZERO_WIDTH_SPACE } from './constant.js';
import { assertExists, Signal } from '@blocksuite/global/utils';
import type { DeltaInsert, TextAttributes, TextElement } from './types.js';
import { deltaInsersToChunks } from './utils/convert.js';
import { VirgoLine } from './components/virgo-line.js';
import { BaseText } from './components/base-text.js';
import { baseRenderElement } from './utils/render.js';

export interface RangeStatic {
  index: number;
  length: number;
}

export interface DomPoint {
  // which text node this point is in
  text: Text;
  // the index here is relative to the Editor, not text node
  index: number;
}

export type UpdateRangeStaticProp = [
  RangeStatic | null,
  'native' | 'input' | 'other'
];

export class TextEditor {
  private _rootElement: HTMLElement | null = null;
  private _rangeStatic: RangeStatic | null = null;
  private _isComposing = false;
  private _renderElement: (delta: DeltaInsert) => TextElement =
    baseRenderElement;

  signals: {
    updateRangeStatic: Signal<UpdateRangeStaticProp>;
  };
  yText: Y.Text;

  constructor(
    yText: TextEditor['yText'],
    renderElement?: (delta: DeltaInsert) => TextElement
  ) {
    this.yText = yText;
    if (renderElement) {
      this._renderElement = renderElement;
    }

    this.signals = {
      updateRangeStatic: new Signal<UpdateRangeStaticProp>(),
    };

    document.addEventListener(
      'selectionchange',
      this._onSelectionChange.bind(this)
    );

    yText.observe(this._onYTextChange.bind(this));

    this.signals.updateRangeStatic.on(this._onUpdateRangeStatic.bind(this));
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

  getDeltaByRangeIndex(rangeIndex: RangeStatic['index']): DeltaInsert | null {
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

  getDeltasByRangeStatic(
    rangeStatic: RangeStatic
  ): [DeltaInsert, RangeStatic][] {
    const deltas = this.yText.toDelta() as DeltaInsert[];

    const result: [DeltaInsert, RangeStatic][] = [];
    let index = 0;
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      if (
        index + delta.insert.length >= rangeStatic.index &&
        index < rangeStatic.index + rangeStatic.length
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

  getRangeStatic(): RangeStatic | null {
    return this._rangeStatic;
  }

  setRangeStatic(rangeStatic: RangeStatic): void {
    this.signals.updateRangeStatic.emit([rangeStatic, 'other']);
  }

  deleteText(rangeStatic: RangeStatic): void {
    this.yText.delete(rangeStatic.index, rangeStatic.length);
  }

  insertText(rangeStatic: RangeStatic, text: string): void {
    const currentDelta = this.getDeltaByRangeIndex(rangeStatic.index);
    this.yText.delete(rangeStatic.index, rangeStatic.length);

    if (
      rangeStatic.index > 0 &&
      currentDelta &&
      currentDelta.attributes.type !== 'line-break'
    ) {
      this.yText.insert(rangeStatic.index, text, currentDelta.attributes);
    } else {
      this.yText.insert(rangeStatic.index, text, { type: 'base' });
    }
  }

  insertLineBreak(rangeStatic: RangeStatic): void {
    this.yText.delete(rangeStatic.index, rangeStatic.length);
    this.yText.insert(rangeStatic.index, '\n', { type: 'line-break' });
  }

  formatText(
    rangeStatic: RangeStatic,
    attributes: TextAttributes,
    options: {
      match?: (delta: DeltaInsert, deltaRangeStatic: RangeStatic) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void {
    const { match = () => true, mode = 'replace' } = options;
    const deltas = this.getDeltasByRangeStatic(rangeStatic);

    for (const [delta, deltaRangeStatic] of deltas) {
      if (delta.attributes.type === 'line-break') {
        continue;
      }

      if (match(delta, deltaRangeStatic)) {
        const goalRangeStatic = {
          index: Math.max(rangeStatic.index, deltaRangeStatic.index),
          length:
            Math.min(
              rangeStatic.index + rangeStatic.length,
              deltaRangeStatic.index + deltaRangeStatic.length
            ) - Math.max(rangeStatic.index, deltaRangeStatic.index),
        };

        if (mode === 'replace') {
          this.resetText(goalRangeStatic);
        }

        this.yText.format(
          goalRangeStatic.index,
          goalRangeStatic.length,
          attributes
        );
      }
    }
  }

  resetText(rangeStatic: RangeStatic): void {
    const coverDeltas: DeltaInsert[] = [];
    for (
      let i = rangeStatic.index;
      i <= rangeStatic.index + rangeStatic.length;
      i++
    ) {
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

    this.yText.format(rangeStatic.index, rangeStatic.length, {
      ...unset,
      type: 'base',
    });
  }

  /**
   * sync the dom selection from rangeStatic for **this Editor**
   */
  syncRangeStatic(): void {
    setTimeout(() => {
      if (this._rangeStatic) {
        const newRange = this.toDomRange(this._rangeStatic);

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
   * calculate the dom selection from rangeStatic for **this Editor**
   */
  toDomRange(rangeStatic: RangeStatic): Range | null {
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

        if (!anchorText && index + textLength >= rangeStatic.index) {
          anchorText = textNode;
          anchorOffset = rangeStatic.index - index;
        }
        if (
          !focusText &&
          index + textLength >= rangeStatic.index + rangeStatic.length
        ) {
          focusText = textNode;
          focusOffset = rangeStatic.index + rangeStatic.length - index;
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
   * calculate the rangeStatic from dom selection for **this Editor**
   * there are three cases when the rangeStatic of this Editor is not null:
   * (In the following, "|" mean anchor and focus, each line is a separate Editor)
   * 1. anchor and focus are in this Editor
   *    aaaaaa
   *    b|bbbb|b
   *    cccccc
   *    the rangeStatic of second Editor is {index: 1, length: 4}, the others are null
   * 2. anchor and focus one in this Editor, one in another Editor
   *    aaa|aaa    aaaaaa
   *    bbbbb|b or bbbbb|b
   *    cccccc     cc|cccc
   *    2.1
   *        the rangeStatic of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
   *        the third is null
   *    2.2
   *        the rangeStatic of first Editor is null, the second is {index: 0, length: 5},
   *        the third is {index: 0, length: 2}
   * 3. anchor and focus are in another Editor
   *    aa|aaaa
   *    bbbbbb
   *    cccc|cc
   *    the rangeStatic of first Editor is {index: 2, length: 4},
   *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
   */
  toRangeStatic(selection: Selection): RangeStatic | null {
    assertExists(this._rootElement);

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) {
      return null;
    }

    let anchorText: Text | null = null;
    let anchorTextOffset = anchorOffset;
    let focusText: Text | null = null;
    let focusTextOffset = focusOffset;

    if (anchorNode instanceof Text && ifVirgoText(anchorNode)) {
      anchorText = anchorNode;
      anchorTextOffset = anchorOffset;
    }
    if (focusNode instanceof Text && ifVirgoText(focusNode)) {
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

    if (!this._rangeStatic) {
      return;
    }

    const { inputType, data } = event;
    console.log('inputType', inputType, 'data', data);
    if (inputType === 'insertText' && this._rangeStatic.index >= 0 && data) {
      this.insertText(this._rangeStatic, data);

      this.signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + data.length,
          length: 0,
        },
        'input',
      ]);
    } else if (
      inputType === 'insertParagraph' &&
      this._rangeStatic.index >= 0
    ) {
      this.insertLineBreak(this._rangeStatic);

      this.signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + 1,
          length: 0,
        },
        'input',
      ]);
    } else if (
      inputType === 'deleteContentBackward' &&
      this._rangeStatic.index >= 0
    ) {
      if (this._rangeStatic.length > 0) {
        this.deleteText(this._rangeStatic);

        this.signals.updateRangeStatic.emit([
          {
            index: this._rangeStatic.index,
            length: 0,
          },
          'input',
        ]);
      } else if (this._rangeStatic.index > 0) {
        // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
        const tmpString = this.yText
          .toString()
          .slice(0, this._rangeStatic.index);
        const deletedChracater = [...tmpString].slice(-1).join('');
        this.deleteText({
          index: this._rangeStatic.index - deletedChracater.length,
          length: deletedChracater.length,
        });

        this.signals.updateRangeStatic.emit([
          {
            index: this._rangeStatic.index - deletedChracater.length,
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

    if (!this._rangeStatic) {
      return;
    }

    const { data } = event;

    if (this._rangeStatic.index >= 0 && data) {
      this.insertText(this._rangeStatic, data);

      this.signals.updateRangeStatic.emit([
        {
          index: this._rangeStatic.index + data.length,
          length: 0,
        },
        'input',
      ]);
    }
  }

  private _onYTextChange(): void {
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
  }

  private _onSelectionChange(): void {
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

    const rangeStatic = this.toRangeStatic(selection);
    if (rangeStatic) {
      this.signals.updateRangeStatic.emit([rangeStatic, 'native']);
    }
  }

  private _onUpdateRangeStatic([
    newRangStatic,
    origin,
  ]: UpdateRangeStaticProp): void {
    this._rangeStatic = newRangStatic;

    if (origin === 'native') {
      return;
    }

    // avoid cursor jumping to beginning in a moment
    this._rootElement?.blur();

    const fn = () => {
      // when using input method _RangeStatic will return to the starting point,
      // so we need to reassign
      this._rangeStatic = newRangStatic;
      this.syncRangeStatic();
    };

    // updates in lit are performed asynchronously
    setTimeout(fn, 0);
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

function ifVirgoText(text: Text) {
  return text.parentElement?.dataset.virgoText === 'true' ?? false;
}

function findDocumentOrShadowRoot(editor: TextEditor): Document | ShadowRoot {
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
  const lines: Array<VirgoLine> = [];
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
