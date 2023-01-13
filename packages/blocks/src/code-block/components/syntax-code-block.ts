import Quill from 'quill';
import type { Quill as QuillType } from 'quill';

// @ts-ignore
import type hljs from 'highlight.js';
import { assertExists } from '../../__internal__/index.js';

const Module = Quill.import('core/module');
const CodeBlock = Quill.import('formats/code-block');
const CodeToken = Quill.import('modules/syntax');

function addLineNumber(
  container: HTMLElement,
  lineHeight: string,
  i: number | null
) {
  const node = document.createElement('div');
  if (i) {
    node.innerHTML = `${i}`;
  } else {
    node.innerHTML = '';
    node.style.height = lineHeight;
  }
  container.appendChild(node);
}

class SyntaxCodeBlock extends CodeBlock {
  readonly domNode!: HTMLElement;
  private _observer: MutationObserver | null = null;
  private _lastHasWrap = false;

  constructor(domNode: HTMLElement) {
    super(domNode);
  }

  replaceWith(block: unknown) {
    this.attach();
    super.replaceWith(block);
  }

  refresh(
    highlight: (text: string) => string,
    forceRefresh: boolean,
    codeBlockElement: HTMLElement
  ) {
    if (!this._observer) {
      this._initObserver(codeBlockElement);
    }
    this.highlight(highlight, forceRefresh);
    this.updateLineNumber(codeBlockElement);
  }

  private _initObserver(codeBlockElement: HTMLElement) {
    this._observer = new MutationObserver(e => {
      this.updateLineNumber(codeBlockElement, true);
    });
    this._observer.observe(this.domNode, { attributes: true });
  }

  highlight(highlight: (text: string) => string, forceRefresh: boolean) {
    const text = this.domNode.textContent;
    assertExists(text);
    if (this.cachedText !== text || forceRefresh) {
      if (text.trim().length > 0 || this.cachedText == null) {
        this.domNode.innerHTML = highlight(text);
        this.domNode.normalize();
        this.attach();
      }
      this.cachedText = text;
    }
  }

  private _getCtx() {
    const fontSize = window.getComputedStyle(this.domNode).fontSize;
    const fontFamily = window
      .getComputedStyle(this.domNode)
      .fontFamily.split(',')[0];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.font = `${fontSize} ${fontFamily}`;
    return ctx;
  }

  updateLineNumber(codeBlockElement: HTMLElement, forceRefresh = false) {
    const text = this.domNode.textContent;
    assertExists(text);
    const ctx = this._getCtx();
    const hasWrap = this.domNode.classList.contains('wrap');

    if (
      text === this.cachedTextLineNumber &&
      !(forceRefresh && hasWrap !== this._lastHasWrap)
    ) {
      return;
    }

    this._lastHasWrap = hasWrap;
    const container = codeBlockElement.querySelector(
      '#line-number'
    ) as HTMLDivElement | null;
    assertExists(container);
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const lines = text.split('\n');
    const clientWidth = this.domNode.clientWidth;
    const lineHeight = window.getComputedStyle(this.domNode).lineHeight;
    let lineNum = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // quill specifies to end with a newline, it's redundant for line number see https://quilljs.com/docs/delta/#line-formatting
      if (i === lines.length - 1 && line === '') {
        break;
      }
      const width = ctx.measureText(line).width;
      const lineWrap = width == 0 ? 1 : Math.ceil(width / clientWidth);
      addLineNumber(container, lineHeight, ++lineNum);
      if (hasWrap) {
        for (let i = 1; i < lineWrap; i++) {
          addLineNumber(container, lineHeight, null);
        }
      }
    }

    // adjust position according to line number digits
    const lineNumberDigits = lineNum.toString().length;
    container.style.left = 32 - lineNumberDigits * 8 + 'px';

    this.cachedTextLineNumber = text;
  }
}

export type SyntaxCodeBlockOptions = {
  highlight: (text: string) => string;
  codeBlockElement: HTMLElement;
  language: string;
};
SyntaxCodeBlock.className = 'ql-syntax';

class Syntax extends Module {
  private _language = 'javascript';

  static register() {
    Quill.register(CodeToken, true);
    Quill.register(SyntaxCodeBlock, true);
  }

  constructor(quill: QuillType, options: SyntaxCodeBlockOptions) {
    super(quill, options);
    this._language = options.language;
    if (typeof this.options.highlight !== 'function') {
      throw new Error(
        'Syntax module requires highlight.js. Please include the library on the page before Quill.'
      );
    }
    let timer: number | undefined;
    // TODO Optimize performance when hover
    // @ts-ignore
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        this.highlight(false, options.codeBlockElement);
      }, this.options.interval);
    });
    this.highlight(false, options.codeBlockElement);
  }

  highlight(forceRefresh: boolean, container: HTMLElement) {
    const quill = this.quill;
    if (quill.selection.composing) return;
    // after redo, format will not be continuous, manually set code-block style
    if (!quill.getFormat(0, quill.getLength())['code-block']) {
      quill.formatText(0, quill.getLength(), 'code-block', true);
    }
    // @ts-ignore
    quill.update(Quill.sources.USER);
    const range = quill.getSelection();
    // Notice: In BlockSuite, one quill instance has only one SyntaxCodeBlock instance.
    quill.scroll
      .descendants(SyntaxCodeBlock)
      .forEach((code: SyntaxCodeBlock) => {
        code.refresh(
          (text: string) => {
            return this.options.highlight(text, { language: this._language })
              .value;
          },
          forceRefresh,
          container
        );
      });
    // @ts-ignore
    quill.update(Quill.sources.SILENT);
    if (range != null) {
      // @ts-ignore
      quill.setSelection(range, Quill.sources.SILENT);
    }
  }
}

declare global {
  interface Window {
    hljs: typeof hljs;
  }
}

Syntax.DEFAULTS = {
  highlight: (function () {
    if (window.hljs == null) return null;
    return function (text: string) {
      const result = window.hljs.highlightAuto(text);
      return result.value;
    };
  })(),
  interval: 0,
};

export { SyntaxCodeBlock as CodeBlock, CodeToken, Syntax as default };
