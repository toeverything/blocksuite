import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nothing, render } from 'lit';
import type * as Y from 'yjs';

import { VIRGO_ROOT_ATTR } from './consts.js';
import { VirgoHookService } from './services/hook.js';
import {
  VirgoAttributeService,
  VirgoDeltaService,
  VirgoEventService,
  VirgoRangeService,
} from './services/index.js';
import type { DeltaInsert, VRange, VRangeUpdatedProp } from './types.js';
import {
  type BaseTextAttributes,
  nativePointToTextPoint,
  textPointToDomPoint,
} from './utils/index.js';
import { getTextNodesFromElement } from './utils/text.js';
import { intersectVRange } from './utils/v-range.js';

export type VirgoRootElement<
  T extends BaseTextAttributes = BaseTextAttributes,
> = HTMLElement & {
  virgoEditor: VEditor<T>;
};

export interface VRangeProvider {
  getVRange(): VRange | null;
  setVRange(vRange: VRange | null, sync: boolean): void;
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
  getVRangeFromElement = this.rangeService.getVRangeFromElement;
  getNativeSelection = this.rangeService.getNativeSelection;
  getTextPoint = this.rangeService.getTextPoint;
  getLine = this.rangeService.getLine;
  isVRangeValid = this.rangeService.isVRangeValid;
  isFirstLine = this.rangeService.isFirstLine;
  isLastLine = this.rangeService.isLastLine;
  setVRange = this.rangeService.setVRange;
  focusStart = this.rangeService.focusStart;
  focusEnd = this.rangeService.focusEnd;
  selectAll = this.rangeService.selectAll;
  focusIndex = this.rangeService.focusIndex;
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
    const virgoElement = rootElement as VirgoRootElement<TextAttributes>;
    virgoElement.virgoEditor = this;
    this._rootElement = virgoElement;
    render(nothing, this._rootElement);
    this._rootElement.contentEditable = 'true';
    this._rootElement.dataset.virgoRoot = 'true';

    this._bindYTextObserver();

    this._eventService.mount();

    this._mounted = true;
    this.slots.mounted.emit();
    this._deltaService.render();
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
    this._deltaService.render(syncVRange);
  }

  async waitForUpdate() {
    const vLines = Array.from(this.rootElement.querySelectorAll('v-line'));
    await Promise.all(vLines.map(line => line.updateComplete));
  }

  setReadonly(isReadonly: boolean): void {
    this.rootElement.contentEditable = isReadonly ? 'false' : 'true';
    this._isReadonly = isReadonly;
  }

  get isReadonly() {
    return this._isReadonly;
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
    attributes: TextAttributes,
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
        const normalizedAttributes =
          this._attributeService.normalizeAttributes(attributes);
        if (!normalizedAttributes) return;

        const targetVRange = intersectVRange(vRange, deltaVRange);
        if (!targetVRange) return;

        if (mode === 'replace') {
          this.resetText(targetVRange);
        }

        this._transact(() => {
          this.yText.format(
            targetVRange.index,
            targetVRange.length,
            normalizedAttributes
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
