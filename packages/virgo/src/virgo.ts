import type { NullablePartial } from '@blocksuite/global/types';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { html } from 'lit';
import * as Y from 'yjs';

import type { VirgoLine } from './components/index.js';
import { ZERO_WIDTH_SPACE } from './consts.js';
import {
  VirgoAttributeService,
  VirgoDeltaService,
  VirgoEventService,
  VirgoRangeService,
} from './services/index.js';
import type {
  DeltaInsert,
  TextPoint,
  VRange,
  VRangeUpdatedProp,
} from './types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
  nativePointToTextPoint,
  textPointToDomPoint,
} from './utils/index.js';
import { getTextNodesFromElement } from './utils/text.js';

export interface VEditorOptions {
  // it is a option to determine default `_attributeRenderer`
  defaultMode: 'rich' | 'pure';
}

export class VEditor<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> {
  static nativePointToTextPoint = nativePointToTextPoint;
  static textPointToDomPoint = textPointToDomPoint;
  static getTextNodesFromElement = getTextNodesFromElement;

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

  shouldLineScrollIntoView = true;
  shouldCursorScrollIntoView = true;

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

  setAttributeSchema = this._attributeService.setAttributeSchema;
  setAttributeRenderer = this._attributeService.setAttributeRenderer;
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
  mapDeltasInVRange = this.deltaService.mapDeltasInVRange;

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
        'yText must not contain \r because it will break the range synchronization'
      );
    }

    // we can change default render to pure for making `VEditor` to be a pure string render,
    // you can change schema and renderer again after construction
    if (options.defaultMode === 'pure') {
      this._attributeService.setAttributeRenderer(delta => {
        return html`<span><v-text .str="${delta.insert}"></v-text></span>`;
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
    this.yText.unobserve(this._onYTextChange);

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

      index += vLine.textContent === ZERO_WIDTH_SPACE ? 0 : 1;
    }

    throw new Error('failed to find leaf');
  }

  // the number is related to the VirgoLine's textLength
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
        const targetVRange = this._rangeService.mergeRanges(
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

  setText(
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void {
    this._transact(() => {
      this.yText.delete(0, this.yText.length);
      this.yText.insert(0, text, attributes);
    });
  }

  private _onYTextChange = () => {
    if (this.yText.toString().includes('\r')) {
      throw new Error(
        'yText must not contain \r because it will break the range synchronization'
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
