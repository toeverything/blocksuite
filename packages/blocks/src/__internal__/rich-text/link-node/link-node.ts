import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import Quill from 'quill';

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

  onHover(e: Event) {
    console.log('hover', e);
    return;
  }

  onHoverEnd(e: Event) {
    console.log('onHoverEnd', e);
    return;
  }

  render() {
    return html`<a
      href=${this.href}
      rel="noopener noreferrer"
      target="_blank"
      @mouseover="${this.onHover}"
      @mouseout="${this.onHoverEnd}"
      ><slot></slot
    ></a>`;
  }
}
const Link = Quill.import('formats/link');
Link.tagName = 'link-node'; // Quill uses <a> by default
Quill.register(Link, true);

declare global {
  interface HTMLElementTagNameMap {
    'link-node': LinkNodeComponent;
  }
}
