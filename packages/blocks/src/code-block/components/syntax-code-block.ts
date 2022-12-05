// @ts-nocheck
import Quill from 'quill';

const Module = Quill.import('core/module');
const CodeBlock = Quill.import('formats/code-block');
const CodeToken = Quill.import('modules/syntax');

class SyntaxCodeBlock extends CodeBlock {
  private container: HTMLElement;

  constructor(domNode) {
    super(domNode);
    this.container = document.querySelector('#line-number');
  }

  replaceWith(block: unknown) {
    this.attach();
    super.replaceWith(block);
  }

  update(highlight: (text: string) => string) {
    this.highlight(highlight);
    this.updateLineNumber();
  }

  highlight(highlight: (text: string) => string) {
    const text = this.domNode.textContent;
    if (this.cachedText !== text) {
      if (text.trim().length > 0 || this.cachedText == null) {
        this.domNode.innerHTML = highlight(text);
        this.domNode.normalize();
        this.attach();
      }
      this.cachedText = text;
    }
  }

  updateLineNumber() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    const text = this.domNode.textContent;
    const lines = text.split('\n').length;
    for (let i = 1; i <= lines; i++) {
      const node = document.createElement('div');
      node.innerHTML = i;
      this.container.appendChild(node);
    }
  }
}

SyntaxCodeBlock.className = 'ql-syntax';

class Syntax extends Module {
  private lang = 'javascript';

  static register() {
    Quill.register(CodeToken, true);
    Quill.register(SyntaxCodeBlock, true);
  }

  setLang(lang: string) {
    this.lang = lang;
  }

  constructor(quill: Quill, options: Record<string, unknown>) {
    super(quill, options);
    if (typeof this.options.highlight !== 'function') {
      throw new Error(
        'Syntax module requires highlight.js. Please include the library on the page before Quill.'
      );
    }
    let timer: number | undefined;
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        this.highlight();
      }, this.options.interval);
    });
    this.highlight();
  }

  highlight() {
    if (this.quill.selection.composing) return;
    this.quill.update(Quill.sources.USER);
    const range = this.quill.getSelection();
    // Notice: In BlockSuite, one quill instance has only one SyntaxCodeBlock instance.
    this.quill.scroll.descendants(SyntaxCodeBlock).forEach((code: SyntaxCodeBlock) => {
      code.update((text: string) => {
        return this.options.highlight(text, {language: this.lang}).value;
      });
    });
    this.quill.update(Quill.sources.SILENT);
    if (range != null) {
      this.quill.setSelection(range, Quill.sources.SILENT);
    }
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
  interval: 5,
};

export { SyntaxCodeBlock as CodeBlock, CodeToken, Syntax as default };
