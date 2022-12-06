import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement, unsafeCSS } from 'lit';
import type { CodeBlockModel } from './code-model';
import style from './style.css';
import codeStyle from 'highlight.js/styles/color-brewer.css';
import { BLOCK_ID_ATTR, BlockHost } from '../__internal__';
import highlight from 'highlight.js';

@customElement('code-block')
export class CodeBlockComponent extends LitElement {
  static get styles() {
    return css`
      ${unsafeCSS(style)}
      ${unsafeCSS(codeStyle)}
    `;
  }

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: CodeBlockModel;

  @property()
  host!: BlockHost;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    return html`
      <div class="affine-code-block-container">
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .modules=${{
            syntax: {
              highlight: highlight.highlight,
            },
          }}
        ></rich-text>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'code-block': CodeBlockComponent;
  }
}
