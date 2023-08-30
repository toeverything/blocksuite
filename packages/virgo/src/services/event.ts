import { assertExists } from '@blocksuite/global/utils';

import { ZERO_WIDTH_SPACE } from '../consts.js';
import type { NativePoint } from '../types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
  isInEmbedElement,
} from '../utils/index.js';
import { transformInput } from '../utils/transform-input.js';
import { isMaybeVRangeEqual } from '../utils/v-range.js';
import type { VEditor } from '../virgo.js';
import type { VBeforeinputHookCtx, VCompositionEndHookCtx } from './hook.js';

export class VirgoEventService<TextAttributes extends BaseTextAttributes> {
  private _isComposing = false;

  private _previousAnchor: NativePoint | null = null;
  private _previousFocus: NativePoint | null = null;

  constructor(public readonly editor: VEditor<TextAttributes>) {}

  mount = () => {
    const rootElement = this.editor.rootElement;

    this.editor.disposables.addFromEvent(
      document,
      'selectionchange',
      this._onSelectionChange
    );
    this.editor.disposables.addFromEvent(
      rootElement,
      'beforeinput',
      this._onBeforeInput
    );
    this.editor.disposables.addFromEvent(
      rootElement,
      'compositionstart',
      this._onCompositionStart
    );
    this.editor.disposables.addFromEvent(
      rootElement,
      'compositionend',
      this._onCompositionEnd
    );
    this.editor.disposables.addFromEvent(rootElement, 'scroll', this._onScroll);
    this.editor.disposables.addFromEvent(
      rootElement,
      'keydown',
      this._onKeyDown
    );
    this.editor.disposables.addFromEvent(rootElement, 'click', this._onClick);
  };

  private _onSelectionChange = () => {
    const rootElement = this.editor.rootElement;
    const previousVRange = this.editor.getVRange();
    if (this._isComposing) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection) return;
    if (selection.rangeCount === 0) {
      if (previousVRange !== null) {
        this.editor.slots.vRangeUpdated.emit([null, 'native']);
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
        if (previousVRange !== null) {
          this.editor.slots.vRangeUpdated.emit([null, 'native']);
        }
        return;
      }
    }

    this._previousAnchor = [range.startContainer, range.startOffset];
    this._previousFocus = [range.endContainer, range.endOffset];

    const vRange = this.editor.toVRange(selection.getRangeAt(0));
    if (!isMaybeVRangeEqual(previousVRange, vRange)) {
      this.editor.slots.vRangeUpdated.emit([vRange, 'native']);
    }

    // avoid infinite syncVRange
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
      this.editor.syncVRange();
    }
  };

  private _onCompositionStart = () => {
    this._isComposing = true;
    // embeds is not editable and it will break IME
    const embeds = this.editor.rootElement.querySelectorAll(
      '[data-virgo-embed="true"]'
    );
    embeds.forEach(embed => {
      embed.removeAttribute('contenteditable');
    });
  };

  private _onCompositionEnd = async (event: CompositionEvent) => {
    this._isComposing = false;
    this.editor.rerenderWholeEditor();
    await this.editor.waitForUpdate();

    if (this.editor.isReadonly) return;

    const vRange = this.editor.getVRange();
    if (!vRange) return;

    let ctx: VCompositionEndHookCtx<TextAttributes> | null = {
      vEditor: this.editor,
      raw: event,
      vRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    const hook = this.editor.hooks.compositionEnd;
    if (hook) {
      ctx = hook(ctx);
    }
    if (!ctx) return;

    const { vRange: newVRange, data: newData } = ctx;
    if (newVRange.index >= 0) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        // https://github.com/w3c/input-events/issues/137
        // IME will directly modify the DOM and is difficult to hijack and cancel.
        // We need to delete this part of the content and restore the selection.
        if (container instanceof Text) {
          if (container.parentElement?.dataset.virgoText !== 'true') {
            container.remove();
          } else {
            const [text] = this.editor.getTextPoint(newVRange.index);
            const vText = text.parentElement?.closest('v-text');
            if (vText) {
              if (vText.str !== text.textContent) {
                text.textContent = vText.str;
              }
            } else {
              const forgedVText = text.parentElement?.closest(
                '[data-virgo-text="true"]'
              );
              if (forgedVText instanceof HTMLElement) {
                if (forgedVText.dataset.virgoTextValue) {
                  if (forgedVText.dataset.virgoTextValue !== text.textContent) {
                    text.textContent = forgedVText.dataset.virgoTextValue;
                  }
                } else {
                  throw new Error(
                    'We detect a forged v-text node but it has no data-virgo-text-value attribute.'
                  );
                }
              }
            }
          }

          const newRange = this.editor.toDomRange(newVRange);
          if (newRange) {
            assertExists(newRange);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }

      if (newData && newData.length > 0) {
        this.editor.insertText(newVRange, newData, ctx.attributes);

        this.editor.slots.vRangeUpdated.emit([
          {
            index: newVRange.index + newData.length,
            length: 0,
          },
          'input',
        ]);
      }
    }
  };

  private _firstRecomputeInFrame = true;
  private _onBeforeInput = (event: InputEvent) => {
    event.preventDefault();

    if (this.editor.isReadonly || this._isComposing) return;
    if (this._firstRecomputeInFrame) {
      this._firstRecomputeInFrame = false;
      this._onSelectionChange();
      requestAnimationFrame(() => {
        this._firstRecomputeInFrame = true;
      });
    }
    const vRange = this.editor.getVRange();
    if (!vRange) return;

    let ctx: VBeforeinputHookCtx<TextAttributes> | null = {
      vEditor: this.editor,
      raw: event,
      vRange,
      data: event.data,
      attributes: {} as TextAttributes,
    };
    const hook = this.editor.hooks.beforeinput;
    if (hook) {
      ctx = hook(ctx);
    }
    if (!ctx) return;

    const { raw: newEvent, data, vRange: newVRange } = ctx;
    transformInput<TextAttributes>(
      newEvent.inputType,
      data,
      ctx.attributes,
      newVRange,
      this.editor as VEditor
    );
  };

  private _onScroll = () => {
    this.editor.slots.scrollUpdated.emit(this.editor.rootElement.scrollLeft);
  };

  private _onKeyDown = (event: KeyboardEvent) => {
    if (
      !event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      const vRange = this.editor.getVRange();
      if (!vRange || vRange.length !== 0) return;

      const prevent = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      const deltas = this.editor.getDeltasByVRange(vRange);
      if (deltas.length === 2) {
        if (event.key === 'ArrowLeft' && this.editor.isEmbed(deltas[0][0])) {
          prevent();
          this.editor.setVRange({
            index: vRange.index - 1,
            length: 1,
          });
        } else if (
          event.key === 'ArrowRight' &&
          this.editor.isEmbed(deltas[1][0])
        ) {
          prevent();
          this.editor.setVRange({
            index: vRange.index,
            length: 1,
          });
        }
      } else if (deltas.length === 1) {
        const delta = deltas[0][0];
        if (this.editor.isEmbed(delta)) {
          if (event.key === 'ArrowLeft' && vRange.index - 1 >= 0) {
            prevent();
            this.editor.setVRange({
              index: vRange.index - 1,
              length: 1,
            });
          } else if (
            event.key === 'ArrowRight' &&
            vRange.index + 1 <= this.editor.yTextLength
          ) {
            prevent();
            this.editor.setVRange({
              index: vRange.index,
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
