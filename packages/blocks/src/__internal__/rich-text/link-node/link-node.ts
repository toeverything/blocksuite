import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import { showCreateLinkTooltip } from './create-link';
import { LinkIcon } from './link-icon';

@customElement('link-node')
export class LinkNodeComponent extends LitElement {
  @property()
  href!: string;

  @state()
  private controller = new AbortController();

  static styles = css`
    :host {
      color: var(--affine-highlight-color);
    }

    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `;

  constructor() {
    super();
    this.addEventListener('mouseover', this.onHover);
    this.addEventListener('mouseout', this.onHoverEnd);
  }

  // disable shadow DOM to workaround quill
  // createRenderRoot() {
  //   this.addEventListener('click', (e: Event) => console.log('click', e));
  //   return this;
  // }

  async onHover(e: Event) {
    this.controller.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;

    const link = await showCreateLinkTooltip({
      anchorEl: e.target as HTMLElement,
      signal,
      showMask: false,
    });
    return;
  }

  private onHoverEnd(e: Event) {
    this.controller.abort();
    return;
  }

  render() {
    return html`<span
      ><a href=${this.href} rel="noopener noreferrer" target="_blank"
        >${LinkIcon}<slot></slot></a
    ></span>`;
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
