import type { NullablePartial } from '@blocksuite/global/utils';
import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nothing, render } from 'lit';
import type * as Y from 'yjs';

import type { VirgoLine } from './components/index.js';
import { VIRGO_ROOT_ATTR } from './consts.js';
import { VirgoHookService } from './services/hook.js';
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
import { calculateTextLength, getTextNodesFromElement } from './utils/text.js';
import { intersectVRange } from './utils/v-range.js';

export type VirgoRootElement<
  T extends BaseTextAttributes = BaseTextAttributes,
> = HTMLElement & {
  virgoEditor: VEditor<T>;
};

export interface VRangeProvider {
  getVRange(): VRange | null;
  setVRange(vRange: VRange | null): void;
  vRangeUpdatedSlot: Slot<VRangeUpdatedProp>;
}

export class VEditor<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> {
  static nativePointToTextPoint = nativePointToTextPoint;
  static textPointToDomPoint = textPointToDomPoint;
  static getTextNodesFromElement = getTextNodesFromElement;

  private _disposables = new DisposableGroup();
  get disposables() {
    return this._disposables;
  }

  private readonly _yText: Y.Text;
  private _rootElement: VirgoRootElement<TextAttributes> | null = null;
  private _isReadonly = false;

  private _eventService: VirgoEventService<TextAttributes> =
    new VirgoEventService<TextAttributes>(this);

  private _rangeService: VirgoRangeService<TextAttributes> =
    new VirgoRangeService<TextAttributes>(this);

  private _attributeService: VirgoAttributeService<TextAttributes> =
    new VirgoAttributeService<TextAttributes>(this);

  private _deltaService: VirgoDeltaService<TextAttributes> =
    new VirgoDeltaService<TextAttributes>(this);

  private _hooksService: VirgoHookService<TextAttributes>;

  private _mounted = false;

  readonly isEmbed: (delta: DeltaInsert<TextAttributes>) => boolean;
  readonly vRangeProvider: VRangeProvider | null;

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

  get yTextString() {
    return this.yText.toString();
  }

  get yTextLength() {
    return this.yText.length;
  }

  get yTextDeltas() {
    return this.yText.toDelta();
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

  get mounted() {
    return this._mounted;
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

  // Expose range service API
  toDomRange = this.rangeService.toDomRange;
  toVRange = this.rangeService.toVRange;
  getVRange = this.rangeService.getVRange;
  isVRangeValid = this.rangeService.isVRangeValid;
  setVRange = this.rangeService.setVRange;
  syncVRange = this.rangeService.syncVRange;

  // Expose delta service API
  getDeltasByVRange = this.deltaService.getDeltasByVRange;
  getDeltaByRangeIndex = this.deltaService.getDeltaByRangeIndex;
  mapDeltasInVRange = this.deltaService.mapDeltasInVRange;
  isNormalizedDeltaSelected = this.deltaService.isNormalizedDeltaSelected;

  // Expose hook service API
  get hooks() {
    return this._hooksService.hooks;
  }

  constructor(
    yText: VEditor['yText'],
    ops: {
      isEmbed?: (delta: DeltaInsert<TextAttributes>) => boolean;
      hooks?: VirgoHookService<TextAttributes>['hooks'];
      vRangeProvider?: VRangeProvider;
    } = {}
  ) {
    if (!yText.doc) {
      throw new Error('yText must be attached to a Y.Doc');
    }

    if (yText.toString().includes('\r')) {
      throw new Error(
        'yText must not contain \r because it will break the range synchronization'
      );
    }

    const { isEmbed = () => false, hooks = {}, vRangeProvider = null } = ops;
    this._yText = yText;
    this.isEmbed = isEmbed;
    this._hooksService = new VirgoHookService(this, hooks);
    this.vRangeProvider = vRangeProvider;

    this.slots = {
      mounted: new Slot(),
      unmounted: new Slot(),
      updated: new Slot(),
      vRangeUpdated: new Slot<VRangeUpdatedProp>(),
      rangeUpdated: new Slot<Range>(),
    };

    if (vRangeProvider) {
      vRangeProvider.vRangeUpdatedSlot.on(prop => {
        this.slots.vRangeUpdated.emit(prop);
      });
    }
    this.slots.vRangeUpdated.on(this.rangeService.onVRangeUpdated);
  }

  mount(rootElement: HTMLElement) {
    this._mounted = true;

    const virgoElement = rootElement as VirgoRootElement<TextAttributes>;
    virgoElement.virgoEditor = this;
    this._rootElement = virgoElement;
    render(nothing, this._rootElement);
    this._rootElement.contentEditable = 'true';
    this._rootElement.dataset.virgoRoot = 'true';

    this._bindYTextObserver();

    this._deltaService.render();

    this._eventService.mount();

    this.slots.mounted.emit();
  }

  unmount() {
    render(nothing, this.rootElement);
    this.rootElement.removeAttribute(VIRGO_ROOT_ATTR);
    this._rootElement = null;
    this._mounted = false;
    this.disposables.dispose();
    this.slots.unmounted.emit();
  }

  requestUpdate(syncVRange = true): void {
    Promise.resolve().then(() => {
      this._deltaService.render(syncVRange);
    });
  }

  async waitForUpdate() {
    const vLines = Array.from(this.rootElement.querySelectorAll('v-line'));
    await Promise.all(vLines.map(line => line.updateComplete));
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
        index += calculateTextLength(text);
      }

      index += 1;
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

  selectAll(): void {
    this.rangeService.setVRange({
      index: 0,
      length: this.yText.length,
    });
  }

  focusByIndex(index: number): void {
    this.rangeService.setVRange({
      index: index,
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
      .forEach(([_delta, deltaVRange]) => {
        const targetVRange = intersectVRange(vRange, deltaVRange);

        if (!targetVRange) return;

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

  rerenderWholeEditor() {
    render(nothing, this.rootElement);
    this._deltaService.render();
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

  private _bindYTextObserver() {
    this.yText.observe(this._onYTextChange);
    this.disposables.add({
      dispose: () => {
        this.yText.unobserve(this._onYTextChange);
      },
    });
  }
}
