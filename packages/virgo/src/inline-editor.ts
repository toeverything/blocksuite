import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nothing, render } from 'lit';
import type * as Y from 'yjs';

import { VIRGO_ROOT_ATTR } from './consts.js';
import { InlineHookService } from './services/hook.js';
import {
  VirgoAttributeService,
  VirgoDeltaService,
  VirgoEventService,
  VirgoRangeService,
} from './services/index.js';
import type {
  DeltaInsert,
  InlineRange,
  InlineRangeUpdatedProp,
} from './types.js';
import {
  type BaseTextAttributes,
  nativePointToTextPoint,
  textPointToDomPoint,
} from './utils/index.js';
import { intersectInlineRange } from './utils/inline-range.js';
import { getTextNodesFromElement } from './utils/text.js';

export type InlineRootElement<
  T extends BaseTextAttributes = BaseTextAttributes,
> = HTMLElement & {
  inlineEditor: InlineEditor<T>;
};

export interface InlineRangeProvider {
  getInlineRange(): InlineRange | null;
  setInlineRange(inlineRange: InlineRange | null, sync: boolean): void;
  inlineRangeUpdated: Slot<InlineRangeUpdatedProp>;
}

export class InlineEditor<
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
  private _rootElement: InlineRootElement<TextAttributes> | null = null;
  private _isReadonly = false;

  private _eventService: VirgoEventService<TextAttributes> =
    new VirgoEventService<TextAttributes>(this);

  private _rangeService: VirgoRangeService<TextAttributes> =
    new VirgoRangeService<TextAttributes>(this);

  private _attributeService: VirgoAttributeService<TextAttributes> =
    new VirgoAttributeService<TextAttributes>(this);

  private _deltaService: VirgoDeltaService<TextAttributes> =
    new VirgoDeltaService<TextAttributes>(this);

  private _hooksService: InlineHookService<TextAttributes>;

  private _mounted = false;

  readonly isEmbed: (delta: DeltaInsert<TextAttributes>) => boolean;
  readonly inlineRangeProvider: InlineRangeProvider | null;

  slots: {
    mounted: Slot;
    unmounted: Slot;
    updated: Slot;
    inlineRangeUpdated: Slot<InlineRangeUpdatedProp>;
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
  toInlineRange = this.rangeService.toInlineRange;
  getInlineRange = this.rangeService.getInlineRange;
  getInlineRangeFromElement = this.rangeService.getInlineRangeFromElement;
  getNativeSelection = this.rangeService.getNativeSelection;
  getTextPoint = this.rangeService.getTextPoint;
  getLine = this.rangeService.getLine;
  isValidInlineRange = this.rangeService.isValidInlineRange;
  isFirstLine = this.rangeService.isFirstLine;
  isLastLine = this.rangeService.isLastLine;
  setInlineRange = this.rangeService.setInlineRange;
  focusStart = this.rangeService.focusStart;
  focusEnd = this.rangeService.focusEnd;
  selectAll = this.rangeService.selectAll;
  focusIndex = this.rangeService.focusIndex;
  syncInlineRange = this.rangeService.syncInlineRange;

  // Expose delta service API
  getDeltasByInlineRange = this.deltaService.getDeltasByInlineRange;
  getDeltaByRangeIndex = this.deltaService.getDeltaByRangeIndex;
  mapDeltasInInlineRange = this.deltaService.mapDeltasInInlineRange;
  isNormalizedDeltaSelected = this.deltaService.isNormalizedDeltaSelected;

  // Expose hook service API
  get hooks() {
    return this._hooksService.hooks;
  }

  constructor(
    yText: InlineEditor['yText'],
    ops: {
      isEmbed?: (delta: DeltaInsert<TextAttributes>) => boolean;
      hooks?: InlineHookService<TextAttributes>['hooks'];
      inlineRangeProvider?: InlineRangeProvider;
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

    const {
      isEmbed = () => false,
      hooks = {},
      inlineRangeProvider = null,
    } = ops;
    this._yText = yText;
    this.isEmbed = isEmbed;
    this._hooksService = new InlineHookService(this, hooks);
    this.inlineRangeProvider = inlineRangeProvider;

    this.slots = {
      mounted: new Slot(),
      unmounted: new Slot(),
      updated: new Slot(),
      inlineRangeUpdated: new Slot<InlineRangeUpdatedProp>(),
      rangeUpdated: new Slot<Range>(),
    };

    if (inlineRangeProvider) {
      inlineRangeProvider.inlineRangeUpdated.on(prop => {
        this.slots.inlineRangeUpdated.emit(prop);
      });
    }
    this.slots.inlineRangeUpdated.on(this.rangeService.onInlineRangeUpdated);
  }

  mount(rootElement: HTMLElement) {
    const virgoElement = rootElement as InlineRootElement<TextAttributes>;
    virgoElement.inlineEditor = this;
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

  requestUpdate(syncInlineRange = true): void {
    this._deltaService.render(syncInlineRange);
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

  deleteText(inlineRange: InlineRange): void {
    this._transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
    });
  }

  insertText(
    inlineRange: InlineRange,
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
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, text, normalizedAttributes);
    });
  }

  insertLineBreak(inlineRange: InlineRange): void {
    this._transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, '\n');
    });
  }

  formatText(
    inlineRange: InlineRange,
    attributes: TextAttributes,
    options: {
      match?: (delta: DeltaInsert, deltaInlineRange: InlineRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void {
    const { match = () => true, mode = 'merge' } = options;
    const deltas = this._deltaService.getDeltasByInlineRange(inlineRange);

    deltas
      .filter(([delta, deltaInlineRange]) => match(delta, deltaInlineRange))
      .forEach(([_delta, deltaInlineRange]) => {
        const normalizedAttributes =
          this._attributeService.normalizeAttributes(attributes);
        if (!normalizedAttributes) return;

        const targetInlineRange = intersectInlineRange(
          inlineRange,
          deltaInlineRange
        );
        if (!targetInlineRange) return;

        if (mode === 'replace') {
          this.resetText(targetInlineRange);
        }

        this._transact(() => {
          this.yText.format(
            targetInlineRange.index,
            targetInlineRange.length,
            normalizedAttributes
          );
        });
      });
  }

  resetText(inlineRange: InlineRange): void {
    const coverDeltas: DeltaInsert[] = [];
    for (
      let i = inlineRange.index;
      i <= inlineRange.index + inlineRange.length;
      i++
    ) {
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
      this.yText.format(inlineRange.index, inlineRange.length, {
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
