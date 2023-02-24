import type { BaseBlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { LeafBlot } from 'parchment';
import type { DeltaStatic, Quill as QuillType } from 'quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';

import Syntax from '../../code-block/components/syntax-code-block.js';
import type { BlockHost } from '../utils/index.js';
import { NonShadowLitElement } from '../utils/lit.js';
import { createKeyboardBindings } from './keyboard.js';
import { KeyboardWithEvent } from './quill-keyboard.js';

Quill.register('modules/keyboard', KeyboardWithEvent, true);
Quill.register('modules/cursors', QuillCursors, true);
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

const CodeToken = Quill.import('modules/syntax');
CodeToken.register();
Syntax.register();
Quill.register('modules/syntax', Syntax, true);

@customElement('rich-text')
export class RichText extends NonShadowLitElement {
  static styles = css`
    /*
 * This style is most simple to reset the default styles of the quill editor
 * User should custom the styles of the block in the block itself
 */
    .ql-cursor-flag {
      display: none;
    }
    .ql-container {
      box-sizing: border-box;
      height: 100%;
      margin: 0;
      position: relative;
    }
    .ql-container.ql-disabled .ql-tooltip {
      visibility: hidden;
    }
    .ql-clipboard {
      left: -100000px;
      height: 1px;
      overflow-y: hidden;
      position: absolute;
      top: 50%;
    }
    .ql-container p {
      margin: 0;
      padding: 0;
    }
    .ql-editor {
      box-sizing: border-box;
      height: 100%;
      outline: none;
      tab-size: 4;
      -moz-tab-size: 4;
      text-align: left;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 3px 0;
    }
    .ql-editor > * {
      cursor: text;
    }
    .ql-editor.ql-blank::before {
      color: var(--affine-disable-color);
      content: attr(data-placeholder);
      pointer-events: none;
      position: absolute;
    }
  `;

  @query('.affine-rich-text.quill-container')
  private _textContainer!: HTMLDivElement;

  quill!: QuillType;

  @property({ hasChanged: () => true })
  host!: BlockHost;

  @property()
  model!: BaseBlockModel;

  @property()
  placeholder?: string;

  @property({ hasChanged: () => true })
  modules: Record<string, unknown> = {};

  firstUpdated() {
    const { host, model, placeholder, _textContainer } = this;
    const { page } = host;
    const keyboardBindings = createKeyboardBindings(page, model);

    this.quill = new Quill(_textContainer, {
      modules: Object.assign(
        {
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
        this.modules
      ),
      placeholder,
    });

    page.attachRichText(model.id, this.quill);
    page.awarenessStore.updateLocalCursor(page);
    this.model.propsUpdated.on(() => this.requestUpdate());

    if (this.modules.syntax && this.quill.getText() === '\n') {
      this.quill.focus();
    }
    // If you type a character after the code or link node,
    // the character should not be inserted into the code or link node.
    // So we check and remove the corresponding format manually.
    this.quill.on('text-change', (delta: DeltaStatic, oldDelta, source) => {
      const selectorMap = {
        code: 'code',
        link: 'link-node',
      } as const;
      let attr: keyof typeof selectorMap | null = null;

      if (!delta.ops) {
        return;
      }

      if (delta.ops[1]?.attributes?.code) {
        attr = 'code';
      }
      if (delta.ops[1]?.attributes?.link) {
        attr = 'link';
      }
      // only length is 2 need to be handled
      if (
        delta.ops.length === 2 &&
        delta.ops[1]?.insert &&
        attr &&
        source === 'user'
      ) {
        const retain = delta.ops[0].retain;
        const selector = selectorMap[attr];
        if (retain !== undefined) {
          const currentLeaf: [LeafBlot, number] = this.quill.getLeaf(
            retain + Number(delta.ops[1]?.insert.toString().length)
          );
          const nextLeaf: [LeafBlot, number] = this.quill.getLeaf(
            retain + Number(delta.ops[1]?.insert.toString().length) + 1
          );
          const currentParentElement = currentLeaf[0]?.domNode?.parentElement;
          const currentEmbedElement = currentParentElement?.closest(selector);
          const nextParentElement = nextLeaf[0]?.domNode?.parentElement;
          const nextEmbedElement = nextParentElement?.closest(selector);
          const insertedString: string = delta.ops[1]?.insert.toString();

          // if insert to the same node, no need to handle
          // For example,
          // `inline |code`
          //         ⬆️ should not remove format when insert to inside the format
          if (
            // At the end of the node, need to remove format
            !nextEmbedElement ||
            // At the edge of the node, need to remove format
            nextEmbedElement !== currentEmbedElement
          ) {
            model.text?.replace(
              retain,
              insertedString.length,
              ' ' + insertedString,
              {
                [attr]: false,
              }
            );
          }
        }
      }
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    const { model, host } = this;
    if (this.quill) {
      host.page.attachRichText(model.id, this.quill);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.host.page.detachRichText(this.model.id);
  }

  updated() {
    if (this.modules.syntax) {
      //@ts-ignore
      this.quill.theme.modules.syntax.setLang(this.modules.syntax.language);
    }
    // Update placeholder if block`s type changed
    this.quill?.root.setAttribute('data-placeholder', this.placeholder ?? '');
    this.quill?.root.setAttribute('contenteditable', `${!this.host.readonly}`);
  }

  render() {
    return html`<div class="affine-rich-text quill-container ql-container">
      <slot></slot>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rich-text': RichText;
  }
}
