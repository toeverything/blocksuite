import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import { LinkIcon } from './link-icon';
import { showLinkPopover } from './link-popover';

@customElement('link-node')
export class LinkNodeComponent extends LitElement {
  @property()
  href!: string;

  @property()
  popoverHoverOpenDelay = 150;

  @state()
  popoverTimer = 0;

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
    this.popoverTimer = window.setTimeout(async () => {
      const link = await showLinkPopover({
        anchorEl: e.target as HTMLElement,
        preview: this.href,
        showMask: false,
        interactionKind: 'hover',
      });
      console.log('link', link);
    }, this.popoverHoverOpenDelay);
  }
  async onHoverEnd(e: Event) {
    clearTimeout(this.popoverTimer);
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
