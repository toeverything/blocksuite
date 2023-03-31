import type { NullablePartial } from '@blocksuite/global/types';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { html } from 'lit';
import * as Y from 'yjs';

import type { VirgoLine } from './components/index.js';
import { ZERO_WIDTH_SPACE } from './constant.js';
import { VirgoAttributeService } from './services/attribute.js';
import { VirgoDeltaService } from './services/delta.js';
import { VirgoEventService } from './services/index.js';
import { VirgoRangeService } from './services/range.js';
import type {
  DeltaInsert,
  DomPoint,
  VRange,
  VRangeUpdatedProp,
} from './types.js';
import type { TextPoint } from './types.js';
import {
  type BaseTextAttributes,
  calculateTextLength,
  findDocumentOrShadowRoot,
  isVElement,
  isVLine,
  isVRoot,
  isVText,
} from './utils/index.js';

export interface VEditorOptions {
  // it is a option to determine defult `_attributesRenderer`
  defaultMode: 'rich' | 'pure';
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
      const texts = VEditor.getTextNodesFromElement(node);
      for (let i = 0; i < texts.length; i++) {
        if (offset <= texts[i].length) {
          text = texts[i];
          textOffset = offset;
          break;
        }
        offset -= texts[i].length;
      }
    } else if (isVLine(node) || isVRoot(node)) {
      const texts = VEditor.getTextNodesFromElement(node);
      if (texts.length > 0) {
        text = texts[0];
        textOffset = offset === 0 ? offset : text.length;
      }
    } else {
      if (node instanceof Node) {
        const vLine = node.parentElement?.closest('v-line');
        if (vLine) {
          const vElements = Array.from(vLine.querySelectorAll('v-element'));
          for (let i = 0; i < vElements.length; i++) {
            if (
              node.compareDocumentPosition(vElements[i]) ===
                Node.DOCUMENT_POSITION_CONTAINED_BY ||
              node.compareDocumentPosition(vElements[i]) === 20
            ) {
              const texts = VEditor.getTextNodesFromElement(vElements[0]);
              if (texts.length === 0) return null;
              text = texts[texts.length - 1];
              textOffset = offset === 0 ? offset : text.length;
              break;
            }

            if (
              i === 0 &&
              node.compareDocumentPosition(vElements[i]) ===
                Node.DOCUMENT_POSITION_FOLLOWING
            ) {
              const texts = VEditor.getTextNodesFromElement(vElements[i]);
              if (texts.length === 0) return null;
              text = texts[0];
              textOffset = offset === 0 ? offset : text.length;
              break;
            } else if (
              i === vElements.length - 1 &&
              node.compareDocumentPosition(vElements[i]) ===
                Node.DOCUMENT_POSITION_PRECEDING
            ) {
              const texts = VEditor.getTextNodesFromElement(vElements[i]);
              if (texts.length === 0) return null;
              text = texts[texts.length - 1];
              textOffset = calculateTextLength(text);
              break;
            }

            if (
              i < vElements.length - 1 &&
              node.compareDocumentPosition(vElements[i]) ===
                Node.DOCUMENT_POSITION_PRECEDING &&
              node.compareDocumentPosition(vElements[i + 1]) ===
                Node.DOCUMENT_POSITION_FOLLOWING
            ) {
              const texts = VEditor.getTextNodesFromElement(vElements[i]);
              if (texts.length === 0) return null;
              text = texts[texts.length - 1];
              textOffset = calculateTextLength(text);
              break;
            }
          }
        } else {
          const container =
            node instanceof Element
              ? node.closest('[data-virgo-root="true"]')
              : node.parentElement?.closest('[data-virgo-root="true"]');
          if (container) {
            const vLines = Array.from(container.querySelectorAll('v-line'));
            for (let i = 0; i < vLines.length; i++) {
              if (
                node.compareDocumentPosition(vLines[i]) ===
                  Node.DOCUMENT_POSITION_CONTAINED_BY ||
                node.compareDocumentPosition(vLines[i]) === 20
              ) {
                const texts = VEditor.getTextNodesFromElement(vLines[0]);
                if (texts.length === 0) return null;
                text = texts[texts.length - 1];
                textOffset = offset === 0 ? offset : text.length;
                break;
              }

              if (
                i === 0 &&
                node.compareDocumentPosition(vLines[i]) ===
                  Node.DOCUMENT_POSITION_FOLLOWING
              ) {
                const texts = VEditor.getTextNodesFromElement(vLines[i]);
                if (texts.length === 0) return null;
                text = texts[0];
                textOffset = offset === 0 ? offset : text.length;
                break;
              } else if (
                i === vLines.length - 1 &&
                node.compareDocumentPosition(vLines[i]) ===
                  Node.DOCUMENT_POSITION_PRECEDING
              ) {
                const texts = VEditor.getTextNodesFromElement(vLines[i]);
                if (texts.length === 0) return null;
                text = texts[texts.length - 1];
                textOffset = calculateTextLength(text);
                break;
              }

              if (
                i < vLines.length - 1 &&
                node.compareDocumentPosition(vLines[i]) ===
                  Node.DOCUMENT_POSITION_PRECEDING &&
                node.compareDocumentPosition(vLines[i + 1]) ===
                  Node.DOCUMENT_POSITION_FOLLOWING
              ) {
                const texts = VEditor.getTextNodesFromElement(vLines[i]);
                if (texts.length === 0) return null;
                text = texts[texts.length - 1];
                textOffset = calculateTextLength(text);
                break;
              }
            }
          }
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

    const texts = VEditor.getTextNodesFromElement(rootElement);
    const goalIndex = texts.indexOf(text);
    let index = 0;
    for (const text of texts.slice(0, goalIndex)) {
      index += calculateTextLength(text);
    }

    if (text.wholeText !== ZERO_WIDTH_SPACE) {
      index += offset;
    }

    const textParentElement = text.parentElement;
    if (!textParentElement) {
      throw new Error('text element parent not found');
    }

    const lineElement = textParentElement.closest('v-line');

    if (!lineElement) {
      throw new Error('line element not found');
    }

    const lineIndex = Array.from(
      rootElement.querySelectorAll('v-line')
    ).indexOf(lineElement);

    return { text, index: index + lineIndex };
  }

  static getTextNodesFromElement(element: Element): Text[] {
    const textSpanElements = Array.from(
      element.querySelectorAll('[data-virgo-text="true"]')
    );
    const textNodes = textSpanElements.map(textSpanElement => {
      const textNode = Array.from(textSpanElement.childNodes).find(
        (node): node is Text => node instanceof Text
      );

      if (!textNode) {
        throw new Error('text node not found');
      }

      return textNode;
    });

    return textNodes;
  }

  private readonly _yText: Y.Text;
  private _rootElement: HTMLElement | null = null;
  private _isReadonly = false;

  private _eventService: VirgoEventService<TextAttributes> =
    new VirgoEventService<TextAttributes>(this);

  private _rangeService: VirgoRangeService<TextAttributes> =
    new VirgoRangeService<TextAttributes>(this);

  private _attributeService: VirgoAttributeService<TextAttributes> =
    new VirgoAttributeService<TextAttributes>(this);

  private _deltaService: VirgoDeltaService<TextAttributes> =
    new VirgoDeltaService<TextAttributes>(this);

  shouldScrollIntoView = true;

  slots: {
    mounted: Slot;
    unmounted: Slot;
    updated: Slot;
    vRangeUpdated: Slot<VRangeUpdatedProp>;
    rangeUpdated: Slot<Range>;
  };

  get yText() {
    return this._yText;
  }

  get rootElement() {
    assertExists(this._rootElement);
    return this._rootElement;
  }

  get eventService() {
    return this._eventService;
  }

  get rangeService() {
    return this._rangeService;
  }

  get attributeService() {
    return this._attributeService;
  }

  get deltaService() {
    return this._deltaService;
  }

  // Expose attribute service API
  get marks() {
    return this._attributeService.marks;
  }
  setAttributesSchema = this._attributeService.setAttributesSchema;
  setAttributesRenderer = this._attributeService.setAttributesRenderer;
  setMarks = this._attributeService.setMarks;
  resetMarks = this._attributeService.resetMarks;
  getFormat = this._attributeService.getFormat;

  // Expose event service API
  bindHandlers = this._eventService.bindHandlers;

  // Expose range service API
  toDomRange = this.rangeService.toDomRange;
  toVRange = this.rangeService.toVRange;
  getVRange = this.rangeService.getVRange;
  setVRange = this.rangeService.setVRange;
  syncVRange = this.rangeService.syncVRange;

  // Expose delta service API
  getDeltasByVRange = this.deltaService.getDeltasByVRange;
  getDeltaByRangeIndex = this.deltaService.getDeltaByRangeIndex;
  mapDeltasInRange = this.deltaService.mapDeltasInRange;

  constructor(
    text: VEditor['yText'] | string,
    options: VEditorOptions = {
      defaultMode: 'rich',
    }
  ) {
    let yText: Y.Text;
    if (typeof text === 'string') {
      const temporaryYDoc = new Y.Doc();
      yText = temporaryYDoc.getText('text');
      yText.insert(0, text);
    } else {
      yText = text;
    }

    if (!yText.doc) {
      throw new Error('yText must be attached to a Y.Doc');
    }

    if (yText.toString().includes('\r')) {
      throw new Error(
        'yText must not contain \r because it will break the range synclization'
      );
    }

    // we can change default render to pure for making `VEditor` to be a pure string render,
    // you can change schema and renderer again after construction
    if (options.defaultMode === 'pure') {
      this._attributeService.setAttributesRenderer(delta => {
        return html`<span><v-text .str=${delta.insert}></v-text></span>`;
      });
    }

    this._yText = yText;

    this.slots = {
      mounted: new Slot(),
      unmounted: new Slot(),
      updated: new Slot(),
      vRangeUpdated: new Slot<VRangeUpdatedProp>(),
      rangeUpdated: new Slot<Range>(),
    };

    this.slots.vRangeUpdated.on(this.rangeService.onVRangeUpdated);
  }

  mount(rootElement: HTMLElement) {
    this._rootElement = rootElement;
    this._rootElement.replaceChildren();
    this._rootElement.contentEditable = 'true';
    this._rootElement.dataset.virgoRoot = 'true';
    this.yText.observe(this._onYTextChange);

    this._deltaService.render();

    this._eventService.mount();

    this.slots.mounted.emit();
  }

  unmount() {
    this._eventService.unmount();

    this._rootElement?.replaceChildren();
    this._rootElement = null;

    this.slots.unmounted.emit();
  }

  requestUpdate(): void {
    Promise.resolve().then(() => {
      assertExists(this._rootElement);

      this._deltaService.render();
    });
  }

  getNativeSelection(): Selection | null {
    const selectionRoot = findDocumentOrShadowRoot(this);
    const selection = selectionRoot.getSelection();
    if (!selection) return null;
    if (selection.rangeCount === 0) return null;

    return selection;
  }

  getTextPoint(rangeIndex: VRange['index']): TextPoint {
    assertExists(this._rootElement);

    const vLines = Array.from(this._rootElement.querySelectorAll('v-line'));

    let index = 0;
    for (const vLine of vLines) {
      const texts = VEditor.getTextNodesFromElement(vLine);

      for (const text of texts) {
        if (!text.textContent) {
          throw new Error('text element should have textContent');
        }
        if (index + text.textContent.length >= rangeIndex) {
          return [text, rangeIndex - index];
        }
        index += text.textContent.length;
      }

      index += 1;
    }

    throw new Error('failed to find leaf');
  }

  // the number is releated to the VirgoLine's textLength
  getLine(rangeIndex: VRange['index']): readonly [VirgoLine, number] {
    assertExists(this._rootElement);
    const lineElements = Array.from(
      this._rootElement.querySelectorAll('v-line')
    );

    let index = 0;
    for (const lineElement of lineElements) {
      if (rangeIndex >= index && rangeIndex <= index + lineElement.textLength) {
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

  setReadonly(isReadonly: boolean): void {
    this.rootElement.contentEditable = isReadonly ? 'false' : 'true';
    this._isReadonly = isReadonly;
  }

  get isReadonly() {
    return this._isReadonly;
  }

  /**
   * the vRange is synced to the native selection asynchronically
   */
  focusEnd(): void {
    this.rangeService.setVRange({
      index: this.yText.length,
      length: 0,
    });
  }

  deleteText(vRange: VRange): void {
    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
    });
  }

  insertText(
    vRange: VRange,
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void {
    if (this._attributeService.marks) {
      attributes = { ...attributes, ...this._attributeService.marks };
    }
    const normalizedAttributes =
      this._attributeService.normalizeAttributes(attributes);

    if (!text || !text.length) {
      throw new Error('text must not be empty');
    }

    this._transact(() => {
      this.yText.delete(vRange.index, vRange.length);
      this.yText.insert(vRange.index, text, normalizedAttributes);
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
    attributes: NullablePartial<TextAttributes>,
    options: {
      match?: (delta: DeltaInsert, deltaVRange: VRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void {
    const { match = () => true, mode = 'merge' } = options;
    const deltas = this._deltaService.getDeltasByVRange(vRange);

    deltas
      .filter(([delta, deltaVRange]) => match(delta, deltaVRange))
      .forEach(([delta, deltaVRange]) => {
        const targetVRange = this._rangeService.mergeTwoRanges(
          vRange,
          deltaVRange
        );

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
      });
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

  private _onYTextChange = () => {
    if (this.yText.toString().includes('\r')) {
      throw new Error(
        'yText must not contain \r because it will break the range synclization'
      );
    }

    Promise.resolve().then(() => {
      assertExists(this._rootElement);

      this.deltaService.render();
    });
  };

  private _transact(fn: () => void): void {
    const doc = this.yText.doc;
    if (!doc) {
      throw new Error('yText is not attached to a doc');
    }

    doc.transact(fn, doc.clientID);
  }
}
