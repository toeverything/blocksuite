import { assertExists } from '@blocksuite/global/utils';

import type { NativePoint, VRange } from '../types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
} from '../utils/index.js';
import { transformInput } from '../utils/transform-input.js';
import type { VEditor } from '../virgo.js';

export interface VHandlerContext<
  T extends BaseTextAttributes,
  E extends Event = Event
> {
  event: E;
  data: string | null;
  vRange: VRange;
  skipDefault: boolean;
  attributes: T | null;
}

export class VirgoEventService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  private _mountAbortController: AbortController | null = null;
  private _handlerAbortController: AbortController | null = null;

  private _isComposing = false;

  private _handlers: {
    keydown?: (event: KeyboardEvent) => void;
    paste?: (event: ClipboardEvent) => void;
    // corresponding to native input event and used to take over default behavior in virgo
    virgoInput?: (
      ctx: VHandlerContext<TextAttributes, InputEvent>
    ) => VHandlerContext<TextAttributes, InputEvent>;
    // corresponding to native compositionend event and used to take over default behavior in virgo
    virgoCompositionEnd?: (
      ctx: VHandlerContext<TextAttributes, CompositionEvent>
    ) => VHandlerContext<TextAttributes, CompositionEvent>;
  } = {};

  private _previousAnchor: NativePoint | null = null;
  private _previousFocus: NativePoint | null = null;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  defaultHandlers: VirgoEventService<TextAttributes>['_handlers'] = {
    paste: (event: ClipboardEvent) => {
      const data = event.clipboardData?.getData('text/plain');
      if (data) {
        const vRange = this._editor.getVRange();
        const text = data.replace(/(\r\n|\r|\n)/g, '\n');
        if (vRange) {
          this._editor.insertText(vRange, text);
          this._editor.setVRange({
            index: vRange.index + text.length,
            length: 0,
          });
        }
      }
    },
  };

  mount = () => {
    const rootElement = this._editor.rootElement;
    this._mountAbortController = new AbortController();

    document.addEventListener('selectionchange', this._onSelectionChange);

    const signal = this._mountAbortController.signal;

    rootElement.addEventListener('beforeinput', this._onBeforeInput, {
      signal,
    });
    rootElement
      .querySelectorAll('[data-virgo-text="true"]')
      .forEach(textNode => {
        textNode.addEventListener('dragstart', event => {
          event.preventDefault();
        });
      });

    rootElement.addEventListener('compositionstart', this._onCompositionStart, {
      signal,
    });
    rootElement.addEventListener('compositionend', this._onCompositionEnd, {
      signal,
    });
    rootElement.addEventListener('scroll', this._onScroll);

    this.bindHandlers();
  };

  unmount = () => {
    document.removeEventListener('selectionchange', this._onSelectionChange);
    if (this._mountAbortController) {
      this._mountAbortController.abort();
      this._mountAbortController = null;
    }

    if (this._handlerAbortController) {
      this._handlerAbortController.abort();
      this._handlerAbortController = null;
    }

    this._handlers = this.defaultHandlers;
  };

  bindHandlers = (
    handlers: VirgoEventService<TextAttributes>['_handlers'] = this
      .defaultHandlers
  ) => {
    this._handlers = handlers;

    if (this._handlerAbortController) {
      this._handlerAbortController.abort();
    }

    this._handlerAbortController = new AbortController();

    if (this._handlers.paste) {
      this._editor.rootElement.addEventListener('paste', this._handlers.paste, {
        signal: this._handlerAbortController.signal,
      });
    }

    if (this._handlers.keydown) {
      this._editor.rootElement.addEventListener(
        'keydown',
        this._handlers.keydown,
        {
          signal: this._handlerAbortController.signal,
        }
      );
    }
  };

  private _onSelectionChange = () => {
    const rootElement = this._editor.rootElement;
    if (this._isComposing) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this._editor);
    const selection = selectionRoot.getSelection();
    if (!selection) return;
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range) return;
    if (!range.intersectsNode(rootElement)) {
      if (
        range.endContainer.contains(rootElement) &&
        Array.from(range.endContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1 &&
        range.startContainer.contains(rootElement) &&
        Array.from(range.startContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1
      ) {
        this._editor.focusEnd();
      } else {
        return;
      }
    }

    this._previousAnchor = [range.startContainer, range.startOffset];
    this._previousFocus = [range.endContainer, range.endOffset];

    const vRange = this._editor.toVRange(selection);
    if (vRange) {
      this._editor.slots.vRangeUpdated.emit([vRange, 'native']);
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
      this._editor.syncVRange();
    }
  };

  private _onCompositionStart = () => {
    this._isComposing = true;
  };

  private _onCompositionEnd = (event: CompositionEvent) => {
    this._isComposing = false;

    if (this._editor.isReadonly) return;

    const vRange = this._editor.getVRange();
    if (!vRange) return;

    let ctx: VHandlerContext<TextAttributes, CompositionEvent> = {
      event,
      data: event.data,
      vRange,
      skipDefault: false,
      attributes: null,
    };
    if (this._handlers.virgoCompositionEnd) {
      ctx = this._handlers.virgoCompositionEnd(ctx);
    }
    if (ctx.skipDefault) return;

    const { data, vRange: newVRange } = ctx;
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
            const [text] = this._editor.getTextPoint(newVRange.index);
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

          const newRange = this._editor.toDomRange(newVRange);
          if (!newRange) return;
          assertExists(newRange);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }

      if (data && data.length > 0) {
        this._editor.insertText(
          newVRange,
          data,
          ctx.attributes ?? ({} as TextAttributes)
        );

        this._editor.slots.vRangeUpdated.emit([
          {
            index: newVRange.index + data.length,
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

    if (this._editor.isReadonly || this._isComposing) return;
    if (this._firstRecomputeInFrame) {
      this._firstRecomputeInFrame = false;
      this._onSelectionChange();
      requestAnimationFrame(() => {
        this._firstRecomputeInFrame = true;
      });
    }
    const vRange = this._editor.getVRange();
    if (!vRange) return;

    let ctx: VHandlerContext<TextAttributes, InputEvent> = {
      event,
      data: event.data,
      vRange,
      skipDefault: false,
      attributes: null,
    };
    if (this._handlers.virgoInput) {
      ctx = this._handlers.virgoInput(ctx);
    }

    if (ctx.skipDefault) return;

    const { event: newEvent, data, vRange: newVRange } = ctx;

    transformInput<TextAttributes>(
      newEvent.inputType,
      data,
      ctx.attributes ?? ({} as TextAttributes),
      newVRange,
      this._editor as VEditor
    );
  };

  private _onScroll = (event: Event) => {
    this._editor.slots.scrollUpdated.emit(this._editor.rootElement.scrollLeft);
  };
}
