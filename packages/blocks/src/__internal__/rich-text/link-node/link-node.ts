import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import { assertExists, getModelByElement } from '../../utils';
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

  onHover(e: MouseEvent) {
    this.popoverTimer = window.setTimeout(async () => {
      this.onDelayHover(e);
    }, this.popoverHoverOpenDelay);
  }

  async onDelayHover(e: MouseEvent) {
    const linkState = await showLinkPopover({
      anchorEl: e.target as HTMLElement,
      preview: this.href,
      showMask: false,
      interactionKind: 'hover',
    });
    if (linkState.type !== 'confirm') {
      return;
    }
    const link = linkState.link;

    // TODO fix Blot types
    const blot = Quill.find(this);
    assertExists(blot);
    const model = getModelByElement(this);
    const store = model.store;

    store.captureSync();
    store.transact(() => {
      model.text?.format(blot.offset(), blot.length(), { link });
    });
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
