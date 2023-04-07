import type { NativePoint } from '../types.js';
import {
  type BaseTextAttributes,
  findDocumentOrShadowRoot,
} from '../utils/index.js';
import { transformInput } from '../utils/transform-input.js';
import type { VEditor } from '../virgo.js';

export class VirgoEventService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  private _mountAbortController: AbortController | null = null;
  private _handlerAbortController: AbortController | null = null;

  private _isComposing = false;

  private _handlers: {
    keydown?: (event: KeyboardEvent) => void;
    paste?: (event: ClipboardEvent) => void;
    virgoInput?: (event: InputEvent) => boolean;
    virgoCompositionEnd?: (event: CompositionEvent) => boolean;
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

    let ifSkip = false;
    if (this._handlers.virgoCompositionEnd) {
      ifSkip = this._handlers.virgoCompositionEnd(event);
    }

    if (ifSkip) return;
    const vRange = this._editor.getVRange();
    if (!vRange) return;

    const { data } = event;
    if (vRange.index >= 0 && data) {
      this._editor.insertText(vRange, data);
      this._editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index + data.length,
          length: 0,
        },
        'input',
      ]);
    }
  };

  private _onBeforeInput = (event: InputEvent) => {
    event.preventDefault();

    if (this._isComposing) return;

    let ifSkip = false;
    if (this._handlers.virgoInput) {
      ifSkip = this._handlers.virgoInput(event);
    }

    if (this._editor.isReadonly) return;
    if (ifSkip) return;
    const vRange = this._editor.getVRange();
    if (!vRange) return;

    const { inputType, data } = event;

    transformInput(inputType, data, vRange, this._editor as VEditor);
  };
}
