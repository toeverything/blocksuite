import Q from 'quill';
import type { Quill as QuillType } from 'quill';
// @ts-ignore
import type hljs from 'highlight.js';
import { assertExists } from '../../__internal__/index.js';

const Quill = Q as unknown as typeof QuillType;
const Module = Quill.import('core/module');
const CodeBlock = Quill.import('formats/code-block');
const CodeToken = Quill.import('modules/syntax');

class SyntaxCodeBlock extends CodeBlock {
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
    this.highlight(highlight, forceRefresh);
    this.updateLineNumber(codeBlockElement);
  }

  highlight(highlight: (text: string) => string, forceRefresh: boolean) {
    const text = this.domNode.textContent;
    if (this.cachedText !== text || forceRefresh) {
      if (text.trim().length > 0 || this.cachedText == null) {
        this.domNode.innerHTML = highlight(text);
        this.domNode.normalize();
        this.attach();
      }
      this.cachedText = text;
    }
  }

  updateLineNumber(codeBlockElement: HTMLElement) {
    const text = this.domNode.textContent;
    if (text === this.cachedTextLineNumber) {
      return;
    }
    const container = codeBlockElement.querySelector(
      '#line-number'
    ) as HTMLDivElement | null;
    assertExists(container);
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const lines = text.split('\n');
    // quill must end with a newline, see https://quilljs.com/docs/delta/#line-formatting
    const lineNum = text.endsWith('\n') ? lines.length - 1 : lines.length;

    // adjust position according to line number digits
    const lineNumberDigits = lineNum.toString().length;
    container.style.left = 25 - lineNumberDigits * 8 + 'px';

    for (let i = 1; i <= lineNum; i++) {
      const node = document.createElement('div');
      node.innerHTML = `${i}`;
      container.appendChild(node);
    }

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
  private _codeBlockElement: HTMLElement;

  static register() {
    Quill.register(CodeToken, true);
    Quill.register(SyntaxCodeBlock, true);
  }

  setLang(lang: string) {
    if (this._language === lang) {
      return;
    }
    this._language = lang;
    this.highlight(true, this._codeBlockElement);
  }

  constructor(quill: QuillType, options: SyntaxCodeBlockOptions) {
    super(quill, options);
    this._language = options.language;
    this._codeBlockElement = options.codeBlockElement;
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
