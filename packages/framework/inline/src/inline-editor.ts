import { signal, type Signal } from '@preact/signals-core';
/* eslint-disable @stylistic/ts/lines-between-class-members */
/* eslint-disable perfectionist/sort-classes */
import type * as Y from 'yjs';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists, DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nothing, render, type TemplateResult } from 'lit';

import type { VLine } from './components/v-line.js';
import type { DeltaInsert, InlineRange } from './types.js';

import { INLINE_ROOT_ATTR } from './consts.js';
import { InlineHookService } from './services/hook.js';
import {
  AttributeService,
  DeltaService,
  EventService,
  RangeService,
} from './services/index.js';
import { RenderService } from './services/render.js';
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
  inlineRange$: Signal<InlineRange | null>;
  setInlineRange(inlineRange: InlineRange | null): void;
}

export class InlineEditor<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes,
> {
  static getTextNodesFromElement = getTextNodesFromElement;

  static nativePointToTextPoint = nativePointToTextPoint;

  static textPointToDomPoint = textPointToDomPoint;

  readonly disposables = new DisposableGroup();

  readonly attributeService: AttributeService<TextAttributes> =
    new AttributeService<TextAttributes>(this);
  getFormat = this.attributeService.getFormat;
  normalizeAttributes = this.attributeService.normalizeAttributes;
  resetMarks = this.attributeService.resetMarks;
  setAttributeRenderer = this.attributeService.setAttributeRenderer;
  setAttributeSchema = this.attributeService.setAttributeSchema;
  setMarks = this.attributeService.setMarks;
  get marks() {
    return this.attributeService.marks;
  }

  readonly textService: InlineTextService<TextAttributes> =
    new InlineTextService<TextAttributes>(this);
  deleteText = this.textService.deleteText;
  formatText = this.textService.formatText;
  insertLineBreak = this.textService.insertLineBreak;
  insertText = this.textService.insertText;
  resetText = this.textService.resetText;
  setText = this.textService.setText;

  readonly deltaService: DeltaService<TextAttributes> =
    new DeltaService<TextAttributes>(this);
  getDeltaByRangeIndex = this.deltaService.getDeltaByRangeIndex;
  getDeltasByInlineRange = this.deltaService.getDeltasByInlineRange;
  mapDeltasInInlineRange = this.deltaService.mapDeltasInInlineRange;
  get embedDeltas() {
    return this.deltaService.embedDeltas;
  }

  readonly rangeService: RangeService<TextAttributes> =
    new RangeService<TextAttributes>(this);
  focusEnd = this.rangeService.focusEnd;
  focusIndex = this.rangeService.focusIndex;
  focusStart = this.rangeService.focusStart;
  getInlineRangeFromElement = this.rangeService.getInlineRangeFromElement;
  isFirstLine = this.rangeService.isFirstLine;
  isLastLine = this.rangeService.isLastLine;
  isValidInlineRange = this.rangeService.isValidInlineRange;
  selectAll = this.rangeService.selectAll;
  syncInlineRange = this.rangeService.syncInlineRange;
  toDomRange = this.rangeService.toDomRange;
  toInlineRange = this.rangeService.toInlineRange;
  getLine = this.rangeService.getLine;
  getNativeRange = this.rangeService.getNativeRange;
  getNativeSelection = this.rangeService.getNativeSelection;
  getTextPoint = this.rangeService.getTextPoint;
  get lastStartRelativePosition() {
    return this.rangeService.lastStartRelativePosition;
  }
  get lastEndRelativePosition() {
    return this.rangeService.lastEndRelativePosition;
  }

  readonly eventService: EventService<TextAttributes> =
    new EventService<TextAttributes>(this);
  get isComposing() {
    return this.eventService.isComposing;
  }

  readonly renderService: RenderService<TextAttributes> =
    new RenderService<TextAttributes>(this);
  waitForUpdate = this.renderService.waitForUpdate;
  rerenderWholeEditor = this.renderService.rerenderWholeEditor;
  render = this.renderService.render;
  get rendering() {
    return this.renderService.rendering;
  }

  readonly hooksService: InlineHookService<TextAttributes>;
  get hooks() {
    return this.hooksService.hooks;
  }

  private _eventSource: HTMLElement | null = null;
  get eventSource() {
    return this._eventSource;
  }

  private _isReadonly = false;
  get isReadonly() {
    return this._isReadonly;
  }

  private _mounted = false;
  get mounted() {
    return this._mounted;
  }

  private _rootElement: InlineRootElement<TextAttributes> | null = null;
  get rootElement() {
    assertExists(this._rootElement);
    return this._rootElement;
  }

  private _inlineRangeProviderOverride = false;
  get inlineRangeProviderOverride() {
    return this._inlineRangeProviderOverride;
  }
  readonly inlineRangeProvider: InlineRangeProvider = {
    inlineRange$: signal(null),
    setInlineRange: inlineRange => {
      this.inlineRange$.value = inlineRange;
    },
  };
  get inlineRange$() {
    return this.inlineRangeProvider.inlineRange$;
  }
  setInlineRange = (inlineRange: InlineRange | null) => {
    this.inlineRangeProvider.setInlineRange(inlineRange);
  };
  getInlineRange = () => {
    return this.inlineRange$.peek();
  };

  readonly slots = {
    mounted: new Slot(),
    unmounted: new Slot(),
    renderComplete: new Slot(),
    textChange: new Slot(),
    inlineRangeSync: new Slot<Range | null>(),
    /**
     * Corresponding to the `compositionUpdate` and `beforeInput` events, and triggered only when the `inlineRange` is not null.
     */
    inputting: new Slot(),
    /**
     * Triggered only when the `inlineRange` is not null.
     */
    keydown: new Slot<KeyboardEvent>(),
  };

  readonly vLineRenderer: ((vLine: VLine) => TemplateResult) | null;

  readonly yText: Y.Text;
  get yTextDeltas() {
    return this.yText.toDelta();
  }
  get yTextLength() {
    return this.yText.length;
  }
  get yTextString() {
    return this.yText.toString();
  }

  readonly isEmbed: (delta: DeltaInsert<TextAttributes>) => boolean;

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
      inlineRangeProvider,
      vLineRenderer = null,
    } = ops;
    this.yText = yText;
    this.isEmbed = isEmbed;
    this.vLineRenderer = vLineRenderer;
    this.hooksService = new InlineHookService(this, hooks);
    if (inlineRangeProvider) {
      this.inlineRangeProvider = inlineRangeProvider;
      this._inlineRangeProviderOverride = true;
    }
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

    this.rootElement.replaceChildren();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (this.rootElement as any)['_$litPart$'];

    this.eventService.mount();
    this.rangeService.mount();
    this.renderService.mount();

    this._mounted = true;
    this.slots.mounted.emit();

    this.render();
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
}
