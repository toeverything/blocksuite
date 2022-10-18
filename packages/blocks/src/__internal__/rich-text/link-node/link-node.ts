import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import { sleep } from '../../utils';
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

  // disable shadow DOM to workaround quill
  // createRenderRoot() {
  //   this.addEventListener('click', (e: Event) => console.log('click', e));
  //   return this;
  // }

  async onHover(e: Event) {
    console.log('onHover', e);
    this.controller.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;
    // Workaround for `e.target.getBoundingClientRect` incorrect
    // Remove the `sleep` if the console.log return no zero Rect
    // console.log('DOMRect', (e.target as HTMLElement).getBoundingClientRect());
    await sleep();
    const link = await showCreateLinkTooltip({
      anchorEl: e.target as HTMLElement,
      signal,
      showMask: false,
    });
    return;
  }

  private onHoverEnd(e: Event) {
    this.controller.abort();
    console.log('onHoverEnd', e);
    return;
  }

  render() {
    return html`<span
      ><a
        href=${this.href}
        rel="noopener noreferrer"
        target="_blank"
        @mouseover="${this.onHover}"
        @mouseout="${this.onHoverEnd}"
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
