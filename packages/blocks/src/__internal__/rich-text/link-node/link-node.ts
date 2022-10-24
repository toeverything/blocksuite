import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import { assertExists, getModelByElement } from '../../utils';
import { LinkIcon } from './link-icon';
import { showLinkPopover } from './link-popover/create-link-popover';

// TODO fix Blot types
type Blot = {
  domNode: HTMLElement;
  offset: () => number;
  length: () => number;
};

@customElement('link-node')
export class LinkNodeComponent extends LitElement {
  @property()
  href!: string;

  @property()
  popoverHoverOpenDelay = 150;

  @state()
  popoverTimer = 0;

  static styles = css`
    a {
      color: var(--affine-link-color);
      text-decoration: none;
    }

    /*
    a:visited {
      color: var(--affine-link-visited-color);
    }
    */

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
    const blot: Blot = Quill.find(this);
    assertExists(blot);
    const text = blot.domNode.textContent ?? undefined;

    const linkState = await showLinkPopover({
      anchorEl: e.target as HTMLElement,
      text,
      link: this.href,
      showMask: false,
      interactionKind: 'hover',
    });
    if (linkState.type === 'confirm') {
      const link = linkState.link;
      const newText = linkState.text;
      const isUpdateText = newText !== text;
      assertExists(blot);
      this.updateLink(blot, link, isUpdateText ? newText : undefined);
      return;
    }
    if (linkState.type === 'remove') {
      assertExists(blot);
      this.updateLink(blot, false);
      return;
    }
  }

  /**
   * If no pass text, use the original text
   */
  private async updateLink(blot: Blot, link: string | false, text?: string) {
    const model = getModelByElement(this);
    const store = model.store;

    if (text) {
      // Replace the text
      // Save the blot's index otherwise it will be lost after the blot is removed
      const offset = blot.offset();
      store.captureSync();
      model.text?.delete(offset, blot.length());
      model.text?.insert(text, offset, { link });
    } else {
      store.captureSync();
      model.text?.format(blot.offset(), blot.length(), { link });
    }
  }

  private async onHoverEnd(e: Event) {
    clearTimeout(this.popoverTimer);
  }

  render() {
    return html`<a href=${this.href} rel="noopener noreferrer" target="_blank"
      >${LinkIcon}<slot></slot
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
