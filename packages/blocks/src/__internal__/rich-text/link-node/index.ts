import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import Quill from 'quill';

// See https://quilljs.com/guides/how-to-customize-quill/#customizing-blots
// See https://github.com/quilljs/quill/blob/develop/formats/link.ts
const Link = Quill.import('formats/link');
Link.tagName = 'link-node'; // Quill uses <a> by default
Quill.register(Link, true);

@customElement('link-node')
export class LinkNodeComponent extends LitElement {
  @property()
  href!: string;

  static styles = css`
    :host {
      color: #7389fd;
    }

    a {
      color: inherit;
      text-decoration: none;
    }
  `;

  render() {
    // TODO hover panel
    return html`<span
      ><a href=${this.href} rel="noopener noreferrer" target="_blank"
        ><slot></slot></a
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-node': LinkNodeComponent;
  }
}
