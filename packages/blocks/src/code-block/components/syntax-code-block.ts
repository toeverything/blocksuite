import { assertExists } from '@blocksuite/global/utils';
// @ts-ignore
import type hljs from 'highlight.js';
import type { Quill as QuillType } from 'quill';
import Quill from 'quill';

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
    node.textContent = `${i}`;
  } else {
    node.textContent = '';
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

  updateLineNumber(codeBlockElement: HTMLElement, forceRefresh = false) {
    const text = this.domNode.textContent;
    assertExists(text);
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
    let codeBlockLineNum = 0;
    const mockElement = this._initMockElement();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // quill specifies to end with a newline, it's redundant for line number see https://quilljs.com/docs/delta/#line-formatting
      if (i === lines.length - 1 && line === '') {
        break;
      }

      const width = this._getLineWidth(line, mockElement);
      const lineNumOfOneLine = width == 0 ? 1 : Math.ceil(width / clientWidth);
      addLineNumber(container, lineHeight, ++codeBlockLineNum);
      if (hasWrap) {
        for (let i = 1; i < lineNumOfOneLine; i++) {
          addLineNumber(container, lineHeight, null);
        }
      }
    }
    mockElement.remove();

    // adjust position according to line number digits
    const lineNumberDigits = codeBlockLineNum.toString().length;
    container.style.left = 32 - lineNumberDigits * 8 + 'px';

    this.cachedTextLineNumber = text;
  }

  // Use mock element to compute wrap counts for long lines,
  // so as to mark correct line number.
  private _initMockElement() {
    const mockElement = document.createElement('div');
    mockElement.classList.add('.affine-code-block-container');
    // HTMLElement should append to DOM in order to get scrollWidth, which is 0px otherwise
    this.domNode.appendChild(mockElement);
    mockElement.style.width = '0';
    mockElement.style.whiteSpace = 'pre';
    mockElement.style.position = 'fixed';
    // hide mock element
    mockElement.style.right = '-100px';
    return mockElement;
  }

  private _getLineWidth(line: string, mockElement: HTMLElement) {
    mockElement.textContent = line;
    const width = mockElement.scrollWidth;
    return width;
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

  setLang(lang: string) {
    if (this._language === lang) {
      return;
    }
    this._language = lang;
    this.highlight(true, this._codeBlockElement);
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
