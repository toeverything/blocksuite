import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Quill from 'quill';
import {
  ALLOWED_SCHEMES,
  showLinkPopover,
} from '../../../components/link-popover';
import { assertExists, getModelByElement, hotkey } from '../../utils';
import { LinkIcon } from './link-icon';

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

    hotkey.withDisableHotkey(async () => {
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
    });
  }

  /**
   * If no pass text, use the original text
   */
  private async updateLink(blot: Blot, link: string | false, text?: string) {
    const model = getModelByElement(this);
    const { space } = model;

    if (text) {
      // Replace the text
      // Save the blot's index otherwise it will be lost after the blot is removed
      const offset = blot.offset();
      space.captureSync();
      // TODO save the format of the original text
      // for make a distinction between user type in and set
      model.text?.delete(offset, blot.length());
      model.text?.insert(text, offset);
      model.text?.format(offset, text.length, { link });
    } else {
      space.captureSync();
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
Link.PROTOCOL_WHITELIST = ALLOWED_SCHEMES;
Quill.register(Link, true);

declare global {
  interface HTMLElementTagNameMap {
    'link-node': LinkNodeComponent;
  }
}
