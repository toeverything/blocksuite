import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { DisposableGroup, Slot, assertExists } from '@blocksuite/global/utils';
import { type TemplateResult, nothing, render } from 'lit';
import * as Y from 'yjs';

import type { VLine } from './components/v-line.js';
import type {
  DeltaInsert,
  InlineRange,
  InlineRangeUpdatedProp,
} from './types.js';

import { INLINE_ROOT_ATTR } from './consts.js';
import { InlineHookService } from './services/hook.js';
import {
  AttributeService,
  DeltaService,
  EventService,
  RangeService,
} from './services/index.js';
import { InlineTextService } from './services/text.js';
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
  inlineRangeUpdated: Slot<InlineRangeUpdatedProp>;
  getInlineRange(): InlineRange | null;
  setInlineRange(inlineRange: InlineRange | null, sync: boolean): void;
}

export class InlineEditor<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> {
  private _attributeService: AttributeService<TextAttributes> =
    new AttributeService<TextAttributes>(this);

  private _deltaService: DeltaService<TextAttributes> =
    new DeltaService<TextAttributes>(this);

  private _disposables = new DisposableGroup();

  private _eventService: EventService<TextAttributes> =
    new EventService<TextAttributes>(this);

  private _eventSource: HTMLElement | null = null;

  private _hooksService: InlineHookService<TextAttributes>;

  private _isReadonly = false;

  private _mounted = false;

  private _onYTextChange = (_: Y.YTextEvent, transaction: Y.Transaction) => {
    if (this.yText.toString().includes('\r')) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
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

  private _rangeService: RangeService<TextAttributes> =
    new RangeService<TextAttributes>(this);

  private _rootElement: InlineRootElement<TextAttributes> | null = null;

  private _textService: InlineTextService<TextAttributes> =
    new InlineTextService<TextAttributes>(this);

  private readonly _yText: Y.Text;

  static getTextNodesFromElement = getTextNodesFromElement;

  static nativePointToTextPoint = nativePointToTextPoint;

  static textPointToDomPoint = textPointToDomPoint;

  // Expose text service API
  deleteText = this._textService.deleteText;

  focusEnd = this.rangeService.focusEnd;

  focusIndex = this.rangeService.focusIndex;

  focusStart = this.rangeService.focusStart;

  formatText = this._textService.formatText;

  getDeltaByRangeIndex = this.deltaService.getDeltaByRangeIndex;

  // Expose delta service API
  getDeltasByInlineRange = this.deltaService.getDeltasByInlineRange;

  getFormat = this._attributeService.getFormat;

  getInlineRange = this.rangeService.getInlineRange;

  getInlineRangeFromElement = this.rangeService.getInlineRangeFromElement;

  getLine = this.rangeService.getLine;

  getNativeSelection = this.rangeService.getNativeSelection;

  getTextPoint = this.rangeService.getTextPoint;

  readonly inlineRangeProvider: InlineRangeProvider | null;

  insertLineBreak = this._textService.insertLineBreak;

  insertText = this._textService.insertText;

  readonly isEmbed: (delta: DeltaInsert<TextAttributes>) => boolean;

  isFirstLine = this.rangeService.isFirstLine;

  isLastLine = this.rangeService.isLastLine;

  isValidInlineRange = this.rangeService.isValidInlineRange;

  mapDeltasInInlineRange = this.deltaService.mapDeltasInInlineRange;

  resetMarks = this._attributeService.resetMarks;

  resetText = this._textService.resetText;

  selectAll = this.rangeService.selectAll;

  setAttributeRenderer = this._attributeService.setAttributeRenderer;

  setAttributeSchema = this._attributeService.setAttributeSchema;

  setInlineRange = this.rangeService.setInlineRange;

  setMarks = this._attributeService.setMarks;

  setText = this._textService.setText;

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

  syncInlineRange = this.rangeService.syncInlineRange;

  // Expose range service API
  toDomRange = this.rangeService.toDomRange;

  toInlineRange = this.rangeService.toInlineRange;

  readonly vLineRenderer: ((vLine: VLine) => TemplateResult) | null;

  constructor(
    yText: InlineEditor['yText'],
    ops: {
      isEmbed?: (delta: DeltaInsert<TextAttributes>) => boolean;
      hooks?: InlineHookService<TextAttributes>['hooks'];
      inlineRangeProvider?: InlineRangeProvider;
      vLineRenderer?: (vLine: VLine) => TemplateResult;
    } = {}
  ) {
    if (!yText.doc) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
        'yText must be attached to a Y.Doc'
      );
    }

    if (yText.toString().includes('\r')) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
        'yText must not contain "\\r" because it will break the range synchronization'
      );
    }

    const {
      isEmbed = () => false,
      hooks = {},
      inlineRangeProvider = null,
      vLineRenderer = null,
    } = ops;
    this._yText = yText;
    this.isEmbed = isEmbed;
    this.vLineRenderer = vLineRenderer;
    this._hooksService = new InlineHookService(this, hooks);
    this.inlineRangeProvider = inlineRangeProvider;

    if (inlineRangeProvider) {
      inlineRangeProvider.inlineRangeUpdated.on(prop => {
        this.slots.inlineRangeUpdate.emit(prop);
      });
    }
    this.slots.inlineRangeUpdate.on(this.rangeService.onInlineRangeUpdated);
  }

  private _bindYTextObserver() {
    this.yText.observe(this._onYTextChange);
    this.disposables.add({
      dispose: () => {
        this.yText.unobserve(this._onYTextChange);
      },
    });
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

  requestUpdate(syncInlineRange = true): void {
    this._deltaService.render(syncInlineRange).catch(console.error);
  }

  rerenderWholeEditor() {
    if (!this.rootElement.isConnected) return;
    render(nothing, this.rootElement);
    this._deltaService.render().catch(console.error);
  }

  setReadonly(isReadonly: boolean): void {
    const value = isReadonly ? 'false' : 'true';

    if (this.rootElement.contentEditable !== value) {
      this.rootElement.contentEditable = value;
    }

    if (this.eventSource && this.eventSource.contentEditable !== value) {
      this.eventSource.contentEditable = value;
    }

    this._isReadonly = isReadonly;
  }

  transact(fn: () => void): void {
    const doc = this.yText.doc;
    if (!doc) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
        'yText is not attached to a doc'
      );
    }

    doc.transact(fn, doc.clientID);
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

  async waitForUpdate() {
    const vLines = Array.from(this.rootElement.querySelectorAll('v-line'));
    await Promise.all(vLines.map(line => line.updateComplete));
  }

  get attributeService() {
    return this._attributeService;
  }

  get deltaService() {
    return this._deltaService;
  }

  get disposables() {
    return this._disposables;
  }

  get eventService() {
    return this._eventService;
  }

  get eventSource() {
    return this._eventSource;
  }

  // Expose hook service API
  get hooks() {
    return this._hooksService.hooks;
  }

  // Expose event service API
  get isComposing() {
    return this._eventService.isComposing;
  }

  get isReadonly() {
    return this._isReadonly;
  }

  // Expose attribute service API
  get marks() {
    return this._attributeService.marks;
  }

  get mounted() {
    return this._mounted;
  }

  get rangeService() {
    return this._rangeService;
  }

  get rootElement() {
    assertExists(this._rootElement);
    return this._rootElement;
  }

  get yText() {
    return this._yText;
  }

  get yTextDeltas() {
    return this.yText.toDelta();
  }

  get yTextLength() {
    return this.yText.length;
  }

  get yTextString() {
    return this.yText.toString();
  }
}
