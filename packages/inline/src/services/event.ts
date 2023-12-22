import { assertExists } from '@blocksuite/global/utils';

import { ZERO_WIDTH_SPACE } from '../consts.js';
import type { InlineEditor } from '../inline-editor.js';
import type { NativePoint } from '../types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
  isInEmbedElement,
} from '../utils/index.js';
import { isMaybeInlineRangeEqual } from '../utils/inline-range.js';
import { transformInput } from '../utils/transform-input.js';
import type { BeforeinputHookCtx, CompositionEndHookCtx } from './hook.js';

export class EventService<TextAttributes extends BaseTextAttributes> {
  private _isComposing = false;

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

  private _isRangeCompletelyInEventSource = () => {
    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);

    const eventSource = this.editor.eventSource;
    const eventSourceRange = document.createRange();
    eventSourceRange.selectNode(eventSource);

    if (
      range.startContainer.compareDocumentPosition(range.endContainer) &
      Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      return (
        eventSourceRange.comparePoint(
          range.startContainer,
          range.startOffset
        ) >= 0 &&
        eventSourceRange.comparePoint(range.endContainer, range.endOffset) <= 0
      );
    } else {
      return (
        eventSourceRange.comparePoint(range.endContainer, range.startOffset) >=
          0 &&
        eventSourceRange.comparePoint(range.startContainer, range.endOffset) <=
          0
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

    if (
      range.startContainer === range.endContainer &&
      range.startContainer.textContent === ZERO_WIDTH_SPACE &&
      range.startOffset === 1
    ) {
      range.setStart(range.startContainer, 0);
      range.setEnd(range.endContainer, 0);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

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

  private _onCompositionStart = () => {
    this._isComposing = true;
    // embeds is not editable and it will break IME
    const embeds = this.editor.rootElement.querySelectorAll(
      '[data-v-embed="true"]'
    );
    embeds.forEach(embed => {
      embed.removeAttribute('contenteditable');
    });
  };

  private _onCompositionEnd = async (event: CompositionEvent) => {
    this._isComposing = false;
    this.editor.rerenderWholeEditor();
    await this.editor.waitForUpdate();

    if (this.editor.isReadonly || !this._isRangeCompletelyInEventSource())
      return;

    const inlineRange = this.editor.getInlineRange();
    if (!inlineRange) return;

    let ctx: CompositionEndHookCtx<TextAttributes> | null = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    const hook = this.editor.hooks.compositionEnd;
    if (hook) {
      ctx = hook(ctx);
    }
    if (!ctx) return;

    const { inlineRange: newInlineRange, data: newData } = ctx;
    if (newInlineRange.index >= 0) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        // https://github.com/w3c/input-events/issues/137
        // IME will directly modify the DOM and is difficult to hijack and cancel.
        // We need to delete this part of the content and restore the selection.
        if (container instanceof Text) {
          if (container.parentElement?.dataset.vText !== 'true') {
            container.remove();
          } else {
            const [text] = this.editor.getTextPoint(newInlineRange.index);
            const vText = text.parentElement?.closest('v-text');
            if (vText) {
              if (vText.str !== text.textContent) {
                text.textContent = vText.str;
              }
            } else {
              const forgedVText = text.parentElement?.closest(
                '[data-v-text="true"]'
              );
              if (forgedVText instanceof HTMLElement) {
                if (forgedVText.dataset.vTextValue) {
                  if (forgedVText.dataset.vTextValue !== text.textContent) {
                    text.textContent = forgedVText.dataset.vTextValue;
                  }
                } else {
                  throw new Error(
                    'We detect a forged v-text node but it has no data-v-text-value attribute.'
                  );
                }
              }
            }
          }

          const newRange = this.editor.toDomRange(newInlineRange);
          if (newRange) {
            assertExists(newRange);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }

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
    }
  };

  private _onBeforeInput = (event: InputEvent) => {
    event.preventDefault();

    if (
      this.editor.isReadonly ||
      this._isComposing ||
      !this._isRangeCompletelyInEventSource()
    )
      return;

    if (!this.editor.getInlineRange()) return;

    const targetRanges = event.getTargetRanges();
    if (targetRanges.length > 0) {
      const staticRange = targetRanges[0];
      const range = document.createRange();
      range.setStart(staticRange.startContainer, staticRange.startOffset);
      range.setEnd(staticRange.endContainer, staticRange.endOffset);
      const inlineRange = this.editor.toInlineRange(range);

      if (!isMaybeInlineRangeEqual(this.editor.getInlineRange(), inlineRange)) {
        this.editor.setInlineRange(inlineRange, false);
      }
    }

    const inlineRange = this.editor.getInlineRange();
    if (!inlineRange) return;

    let ctx: BeforeinputHookCtx<TextAttributes> | null = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange: inlineRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    const hook = this.editor.hooks.beforeinput;
    if (hook) {
      ctx = hook(ctx);
    }
    if (!ctx) return;

    const { raw: newEvent, data, inlineRange: newInlineRange } = ctx;
    transformInput<TextAttributes>(
      newEvent.inputType,
      data,
      ctx.attributes,
      newInlineRange,
      this.editor as InlineEditor
    );
  };

  private _onKeyDown = (event: KeyboardEvent) => {
    if (
      !event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      const inlineRange = this.editor.getInlineRange();
      if (!inlineRange || inlineRange.length !== 0) return;

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
