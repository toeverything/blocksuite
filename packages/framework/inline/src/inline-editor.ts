import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nothing, render } from 'lit';
import * as Y from 'yjs';

import { INLINE_ROOT_ATTR } from './consts.js';
import { InlineHookService } from './services/hook.js';
import {
  AttributeService,
  DeltaService,
  EventService,
  RangeService,
} from './services/index.js';
import { InlineTextService } from './services/text.js';
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
  private _eventSource: HTMLElement | null = null;
  private _isReadonly = false;

  private _eventService: EventService<TextAttributes> =
    new EventService<TextAttributes>(this);

  private _rangeService: RangeService<TextAttributes> =
    new RangeService<TextAttributes>(this);

  private _attributeService: AttributeService<TextAttributes> =
    new AttributeService<TextAttributes>(this);

  private _deltaService: DeltaService<TextAttributes> =
    new DeltaService<TextAttributes>(this);

  private _textService: InlineTextService<TextAttributes> =
    new InlineTextService<TextAttributes>(this);

  private _hooksService: InlineHookService<TextAttributes>;

  private _mounted = false;

  readonly isEmbed: (delta: DeltaInsert<TextAttributes>) => boolean;
  readonly inlineRangeProvider: InlineRangeProvider | null;

  readonly slots = {
    mounted: new Slot(),
    unmounted: new Slot(),
    textChange: new Slot(),
    render: new Slot(),
    renderComplete: new Slot(),
    inlineRangeUpdate: new Slot<InlineRangeUpdatedProp>(),
    inlineRangeApply: new Slot<Range>(),
    /**
     * Corresponding to the `compositionUpdate` and `beforeInput` events, and triggered only when the `inlineRange` is not null.
     */
    inputting: new Slot(),
    /**
     * Triggered only when the `inlineRange` is not null.
     */
    keydown: new Slot<KeyboardEvent>(),
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

  get eventSource() {
    assertExists(this._eventSource);
    return this._eventSource;
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

  // Expose text service API
  deleteText = this._textService.deleteText;
  insertText = this._textService.insertText;
  insertLineBreak = this._textService.insertLineBreak;
  formatText = this._textService.formatText;
  resetText = this._textService.resetText;
  setText = this._textService.setText;

  // Expose hook service API
  get hooks() {
    return this._hooksService.hooks;
  }

  // Expose event service API
  get isComposing() {
    return this._eventService.isComposing;
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
        'yText must not contain "\\r" because it will break the range synchronization'
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

    if (inlineRangeProvider) {
      inlineRangeProvider.inlineRangeUpdated.on(prop => {
        this.slots.inlineRangeUpdate.emit(prop);
      });
    }
    this.slots.inlineRangeUpdate.on(this.rangeService.onInlineRangeUpdated);
  }

  mount(
    rootElement: HTMLElement,
    eventSource: HTMLElement = rootElement,
    isReadonly = false
  ) {
    const inlineRoot = rootElement as InlineRootElement<TextAttributes>;
    inlineRoot.inlineEditor = this;
    this._rootElement = inlineRoot;
    this._eventSource = eventSource;
    this._eventSource.style.outline = 'none';
    this._rootElement.dataset.vRoot = 'true';
    this.setReadonly(isReadonly);
    render(nothing, this._rootElement);

    this._bindYTextObserver();

    this._eventService.mount();

    this._mounted = true;
    this.slots.mounted.emit();
    this._deltaService.render().catch(console.error);
  }

  unmount() {
    if (this.rootElement.isConnected) {
      render(nothing, this.rootElement);
    }
    this.rootElement.removeAttribute(INLINE_ROOT_ATTR);
    this._rootElement = null;
    this._mounted = false;
    this.disposables.dispose();
    this.slots.unmounted.emit();
  }

  requestUpdate(syncInlineRange = true): void {
    this._deltaService.render(syncInlineRange).catch(console.error);
  }

  async waitForUpdate() {
    const vLines = Array.from(this.rootElement.querySelectorAll('v-line'));
    await Promise.all(vLines.map(line => line.updateComplete));
  }

  setReadonly(isReadonly: boolean): void {
    const value = isReadonly ? 'false' : 'true';

    if (this.rootElement.contentEditable !== value) {
      this.rootElement.contentEditable = value;
    }

    if (this.eventSource.contentEditable !== value) {
      this.eventSource.contentEditable = value;
    }

    this._isReadonly = isReadonly;
  }

  get isReadonly() {
    return this._isReadonly;
  }

  rerenderWholeEditor() {
    if (!this.rootElement.isConnected) return;
    render(nothing, this.rootElement);
    this._deltaService.render().catch(console.error);
  }

  transact(fn: () => void): void {
    const doc = this.yText.doc;
    if (!doc) {
      throw new Error('yText is not attached to a doc');
    }

    doc.transact(fn, doc.clientID);
  }

  private _onYTextChange = (_: Y.YTextEvent, transaction: Y.Transaction) => {
    if (this.yText.toString().includes('\r')) {
      throw new Error(
        'yText must not contain "\\r" because it will break the range synchronization'
      );
    }

    this.slots.textChange.emit();

    Promise.resolve()
      .then(() => {
        this.deltaService.render().catch(console.error);

        const inlineRange = this.rangeService.getInlineRange();
        if (!inlineRange || transaction.local) return;

        const lastStartRelativePosition =
          this.rangeService.lastStartRelativePosition;
        const lastEndRelativePosition =
          this.rangeService.lastEndRelativePosition;
        if (!lastStartRelativePosition || !lastEndRelativePosition) return;

        const doc = this.yText.doc;
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
        if (!this.isValidInlineRange(newInlineRange)) return;

        this.setInlineRange(newInlineRange);
      })
      .catch(console.error);
  };

  private _bindYTextObserver() {
    this.yText.observe(this._onYTextChange);
    this.disposables.add({
      dispose: () => {
        this.yText.unobserve(this._onYTextChange);
      },
    });
  }
}
