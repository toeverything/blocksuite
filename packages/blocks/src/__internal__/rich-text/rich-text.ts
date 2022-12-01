import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import type { BaseBlockModel } from '@blocksuite/store';
import type { BlockHost } from '../utils';
import { createKeyboardBindings } from './keyboard';

import style from './styles.css';

Quill.register('modules/cursors', QuillCursors);
const Clipboard = Quill.import('modules/clipboard');
class EmptyClipboard extends Clipboard {
  onPaste() {
    // No need to execute
  }
}
Quill.register('modules/clipboard', EmptyClipboard, true);

const Strike = Quill.import('formats/strike');
// Quill uses <s> by default，but <s> is not supported by HTML5
Strike.tagName = 'del';
Quill.register(Strike, true);

@customElement('rich-text')
export class RichText extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @query('.affine-rich-text.quill-container')
  private _textContainer!: HTMLDivElement;

  quill!: Quill;

  @property()
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  @property()
  placeholder?: string;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    const { host, model, placeholder, _textContainer } = this;
    const { page } = host;
    const keyboardBindings = createKeyboardBindings(page, model);

    this.quill = new Quill(_textContainer, {
      modules: {
        cursors: true,
        toolbar: false,
        history: {
          maxStack: 0,
          userOnly: true,
        },
        keyboard: {
          bindings: keyboardBindings,
        },
      },
      placeholder,
    });

    page.attachRichText(model.id, this.quill);
    page.awareness.updateLocalCursor();
    this.model.propsUpdated.on(() => this.requestUpdate());

    // If you type a character after the code or link node,
    // the character should not be inserted into the code or link node.
    // So we check and remove the corresponding format manually.
    this.quill.on('text-change', delta => {
      const selectorMap = {
        code: 'code',
        link: 'link-code',
      } as const;
      let attr = '';
      if (delta.ops[1]?.attributes?.code) {
        attr = 'code';
      }
      if (delta.ops[1]?.attributes?.link) {
        attr = 'link';
      }
      // only length is 2 need to be handled
      if (delta.ops.length === 2 && delta.ops[1]?.insert && attr) {
        const retain = delta.ops[0].retain;
        const selector = selectorMap[attr as keyof typeof selectorMap];
        if (retain !== undefined) {
          const currentLeaf = this.quill.getLeaf(
            retain + Number(delta.ops[1]?.insert.toString().length)
          );
          const nextLeaf = this.quill.getLeaf(
            retain + Number(delta.ops[1]?.insert.toString().length) + 1
          );
          const currentParentElement = currentLeaf[0]?.domNode?.parentElement;
          const currentEmbedElement = currentParentElement?.closest(selector);
          const nextParentElement = nextLeaf[0]?.domNode?.parentElement;
          const nextEmbedElement = nextParentElement?.closest(selector);
          const insertedString = delta.ops[1]?.insert.toString();
          if (
            (nextEmbedElement && nextEmbedElement !== currentEmbedElement) ||
            !nextEmbedElement
          ) {
            model.text?.replace(
              retain,
              insertedString.length,
              // @ts-expect-error
              !this.host.isCompositionStart
                ? delta.ops[1]?.insert.toString() || ''
                : ' ',
              { [attr]: false }
            );
          }
        }
      }
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.host.page.detachRichText(this.model.id);
  }

  updated() {
    // Update placeholder if block`s type changed
    this.quill?.root.setAttribute('data-placeholder', this.placeholder ?? '');
  }

  render() {
    return html`
      <div class="affine-rich-text quill-container ql-container"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
