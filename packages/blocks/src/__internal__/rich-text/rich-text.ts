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
    const { space } = host;
    const keyboardBindings = createKeyboardBindings(space, model);

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
    this.quill.on('text-change', (delta, oldDelta, source) => {
      // only length is 2 need to be handled
      let selector = '';
      // only length is 2 need to be handled
      if (delta.ops[1]?.attributes?.code) {
        selector = 'code';
      }
      if (delta.ops[1]?.attributes?.link) {
        selector = 'link-node';
      }
      if (delta.ops.length === 2 && delta.ops[1]?.insert && selector) {
        const retain = delta.ops[0].retain;
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
          if (nextEmbedElement && nextEmbedElement !== currentEmbedElement) {
            model.text?.delete(retain, delta.ops[1]?.insert.toString().length);
            // @ts-ignore
            if (!this.host.isCompositionStart) {
              model.text?.insert(delta.ops[1]?.insert.toString() || '', retain);
            } else {
              // FIXME we must add a noon width space to fix cursor
              model.text?.insert(' ', retain);
              this.quill.setSelection(retain + 1, 0, 'api');
            }
          }
          if (
            !nextEmbedElement &&
            insertedString &&
            source === Quill.sources.USER
          ) {
            model.text?.delete(retain, delta.ops[1]?.insert.toString().length);
            model.text?.insert(
              // @ts-ignore
              !this.host.isCompositionStart
                ? delta.ops[1]?.insert.toString() || ''
                : // FIXME we must add a noon width space to fix cursor
                  ' ',
              retain
            );
            this.quill.setSelection(
              retain +
                // @ts-ignore
                (!this.host.isCompositionStart ? insertedString.length : 1),
              0,
              'api'
            );
          }
        }
      }
      // });
    });
    space.attachRichText(model.id, this.quill);
    space.awareness.updateLocalCursor();

    this.model.propsUpdated.on(() => this.requestUpdate());
  }
  updated() {
    // Update placeholder if block`s type changed
    this.quill?.root.setAttribute('data-placeholder', this.placeholder ?? '');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.host.space.detachRichText(this.model.id);
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
