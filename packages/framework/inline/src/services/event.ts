import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange, NativePoint } from '../types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
  isInEmbedElement,
  isInEmbedGap,
  isInEmptyLine,
} from '../utils/index.js';
import { isMaybeInlineRangeEqual } from '../utils/inline-range.js';
import { transformInput } from '../utils/transform-input.js';
import type { BeforeinputHookCtx, CompositionEndHookCtx } from './hook.js';

export class EventService<TextAttributes extends BaseTextAttributes> {
  private _isComposing = false;
  get isComposing() {
    return this._isComposing;
  }

  private _previousAnchor: NativePoint | null = null;
  private _previousFocus: NativePoint | null = null;

  constructor(public readonly editor: InlineEditor<TextAttributes>) {}

  get inlineRangeProvider() {
    return this.editor.inlineRangeProvider;
  }

  mount = () => {
    const eventSource = this.editor.eventSource;
    const rootElement = this.editor.rootElement;

    if (!this.inlineRangeProvider) {
      this.editor.disposables.addFromEvent(
        document,
        'selectionchange',
        this._onSelectionChange
      );
    }

    this.editor.disposables.addFromEvent(
      eventSource,
      'beforeinput',
      this._onBeforeInput
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionstart',
      this._onCompositionStart
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionupdate',
      this._onCompositionUpdate
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionend',
      (event: CompositionEvent) => {
        this._onCompositionEnd(event).catch(console.error);
      }
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'keydown',
      this._onKeyDown
    );
    this.editor.disposables.addFromEvent(rootElement, 'click', this._onClick);
  };

  private _isRangeCompletelyInRoot = (range: Range) => {
    const rootElement = this.editor.rootElement;
    const rootRange = document.createRange();
    rootRange.selectNode(rootElement);

    if (
      range.startContainer.compareDocumentPosition(range.endContainer) &
      Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      return (
        rootRange.comparePoint(range.startContainer, range.startOffset) >= 0 &&
        rootRange.comparePoint(range.endContainer, range.endOffset) <= 0
      );
    } else {
      return (
        rootRange.comparePoint(range.endContainer, range.startOffset) >= 0 &&
        rootRange.comparePoint(range.startContainer, range.endOffset) <= 0
      );
    }
  };

  private _onSelectionChange = () => {
    const rootElement = this.editor.rootElement;
    const previousInlineRange = this.editor.getInlineRange();
    if (this._isComposing) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection) return;
    if (selection.rangeCount === 0) {
      if (previousInlineRange !== null) {
        this.editor.setInlineRange(null, false);
      }

      return;
    }

    const range = selection.getRangeAt(0);
    if (!range.intersectsNode(rootElement)) {
      const isContainerSelected =
        range.endContainer.contains(rootElement) &&
        Array.from(range.endContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1 &&
        range.startContainer.contains(rootElement) &&
        Array.from(range.startContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1;
      if (isContainerSelected) {
        this.editor.focusEnd();
        return;
      } else {
        if (previousInlineRange !== null) {
          this.editor.setInlineRange(null, false);
        }
        return;
      }
    }

    this._previousAnchor = [range.startContainer, range.startOffset];
    this._previousFocus = [range.endContainer, range.endOffset];

    const inlineRange = this.editor.toInlineRange(selection.getRangeAt(0));
    if (!isMaybeInlineRangeEqual(previousInlineRange, inlineRange)) {
      this.editor.setInlineRange(inlineRange, false);
    }

    // avoid infinite syncInlineRange
    if (
      ((range.startContainer.nodeType !== Node.TEXT_NODE ||
        range.endContainer.nodeType !== Node.TEXT_NODE) &&
        range.startContainer !== this._previousAnchor[0] &&
        range.endContainer !== this._previousFocus[0] &&
        range.startOffset !== this._previousAnchor[1] &&
        range.endOffset !== this._previousFocus[1]) ||
      range.startContainer.nodeType === Node.COMMENT_NODE ||
      range.endContainer.nodeType === Node.COMMENT_NODE
    ) {
      this.editor.syncInlineRange();
    }
  };

  private _compositionInlineRange: InlineRange | null = null;
  private _onCompositionStart = () => {
    this._isComposing = true;
    // embeds is not editable and it will break IME
    const embeds = this.editor.rootElement.querySelectorAll(
      '[data-v-embed="true"]'
    );
    embeds.forEach(embed => {
      embed.removeAttribute('contenteditable');
    });

    const range = this.editor.rangeService.getNativeRange();
    if (range) {
      this._compositionInlineRange = this.editor.toInlineRange(range);
    } else {
      this._compositionInlineRange = null;
    }
  };

  private _onCompositionUpdate = () => {
    if (!this.editor.rootElement.isConnected) return;

    const range = this.editor.rangeService.getNativeRange();
    if (
      this.editor.isReadonly ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    this.editor.slots.inputting.emit();
  };

  private _onCompositionEnd = async (event: CompositionEvent) => {
    this._isComposing = false;
    if (!this.editor.rootElement.isConnected) return;

    const range = this.editor.rangeService.getNativeRange();
    if (
      this.editor.isReadonly ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    this.editor.rerenderWholeEditor();
    await this.editor.waitForUpdate();

    const inlineRange = this._compositionInlineRange;
    if (!inlineRange) return;

    event.preventDefault();

    const ctx: CompositionEndHookCtx<TextAttributes> = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    this.editor.hooks.compositionEnd?.(ctx);

    const { inlineRange: newInlineRange, data: newData } = ctx;
    if (newData && newData.length > 0) {
      this.editor.insertText(newInlineRange, newData, ctx.attributes);
      this.editor.setInlineRange(
        {
          index: newInlineRange.index + newData.length,
          length: 0,
        },
        false
      );
    }

    this.editor.slots.inputting.emit();
  };

  private _onBeforeInput = (event: InputEvent) => {
    const range = this.editor.rangeService.getNativeRange();
    if (
      this.editor.isReadonly ||
      this._isComposing ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    const tmpInlineRange = this.editor.toInlineRange(range);
    if (!tmpInlineRange) return;

    let ifHandleTargetRange = true;

    if (event.inputType.startsWith('delete')) {
      if (
        isInEmbedGap(range.commonAncestorContainer) &&
        tmpInlineRange.length === 0 &&
        tmpInlineRange.index > 0
      ) {
        this.editor.setInlineRange({
          index: tmpInlineRange.index - 1,
          length: 1,
        });
        ifHandleTargetRange = false;
      } else if (
        isInEmptyLine(range.commonAncestorContainer) &&
        tmpInlineRange.length === 0 &&
        tmpInlineRange.index > 0
      ) {
        // do not use target range when deleting across lines
        // https://github.com/toeverything/blocksuite/issues/5381
        this.editor.setInlineRange({
          index: tmpInlineRange.index - 1,
          length: 1,
        });
        ifHandleTargetRange = false;
      }
    }

    if (ifHandleTargetRange) {
      const targetRanges = event.getTargetRanges();
      if (targetRanges.length > 0) {
        const staticRange = targetRanges[0];
        const range = document.createRange();
        range.setStart(staticRange.startContainer, staticRange.startOffset);
        range.setEnd(staticRange.endContainer, staticRange.endOffset);
        const inlineRange = this.editor.toInlineRange(range);

        if (
          !isMaybeInlineRangeEqual(this.editor.getInlineRange(), inlineRange)
        ) {
          this.editor.setInlineRange(inlineRange, false);
        }
      }
    }

    const inlineRange = this.editor.getInlineRange();
    if (!inlineRange) return;

    event.preventDefault();

    const ctx: BeforeinputHookCtx<TextAttributes> = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange: inlineRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    this.editor.hooks.beforeinput?.(ctx);

    const { raw: newEvent, data, inlineRange: newInlineRange } = ctx;
    transformInput<TextAttributes>(
      newEvent.inputType,
      data,
      ctx.attributes,
      newInlineRange,
      this.editor as InlineEditor
    );

    this.editor.slots.inputting.emit();
  };

  private _onKeyDown = (event: KeyboardEvent) => {
    const inlineRange = this.editor.getInlineRange();
    if (!inlineRange) return;

    this.editor.slots.keydown.emit(event);

    if (
      !event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      if (inlineRange.length !== 0) return;

      const prevent = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      const deltas = this.editor.getDeltasByInlineRange(inlineRange);
      if (deltas.length === 2) {
        if (event.key === 'ArrowLeft' && this.editor.isEmbed(deltas[0][0])) {
          prevent();
          this.editor.setInlineRange({
            index: inlineRange.index - 1,
            length: 1,
          });
        } else if (
          event.key === 'ArrowRight' &&
          this.editor.isEmbed(deltas[1][0])
        ) {
          prevent();
          this.editor.setInlineRange({
            index: inlineRange.index,
            length: 1,
          });
        }
      } else if (deltas.length === 1) {
        const delta = deltas[0][0];
        if (this.editor.isEmbed(delta)) {
          if (event.key === 'ArrowLeft' && inlineRange.index - 1 >= 0) {
            prevent();
            this.editor.setInlineRange({
              index: inlineRange.index - 1,
              length: 1,
            });
          } else if (
            event.key === 'ArrowRight' &&
            inlineRange.index + 1 <= this.editor.yTextLength
          ) {
            prevent();
            this.editor.setInlineRange({
              index: inlineRange.index,
              length: 1,
            });
          }
        }
      }
    }
  };

  private _onClick = (event: MouseEvent) => {
    // select embed element when click on it
    if (event.target instanceof Node && isInEmbedElement(event.target)) {
      const selectionRoot = findDocumentOrShadowRoot(this.editor);
      const selection = selectionRoot.getSelection();
      if (!selection) return;
      if (event.target instanceof HTMLElement) {
        const vElement = event.target.closest('v-element');
        if (vElement) {
          selection.selectAllChildren(vElement);
        }
      } else {
        const vElement = event.target.parentElement?.closest('v-element');
        if (vElement) {
          selection.selectAllChildren(vElement);
        }
      }
    }
  };
}
