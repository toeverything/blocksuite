import { FontLinkIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { InlineBlot } from 'parchment';
import Quill from 'quill';

import {
  ALLOWED_SCHEMES,
  showLinkPopover,
} from '../../../components/link-popover/index.js';
import { getDefaultPageBlock, getModelByElement } from '../../utils/index.js';

@customElement('link-node')
export class LinkNodeComponent extends LitElement {
  @property()
  href!: string;

  @property()
  popoverHoverOpenDelay = 150;

  @state()
  private popoverTimer = 0;

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
    this.addEventListener('mouseout', this._onHoverEnd);
  }

  // disable shadow DOM to workaround quill
  // createRenderRoot() {
  //   this.addEventListener('click', (e: Event) => console.log('click', e));
  //   return this;
  // }

  onHover(e: MouseEvent) {
    const model = getModelByElement(this);
    const page = getDefaultPageBlock(model);
    if (page.readonly) {
      return;
    }

    this.popoverTimer = window.setTimeout(async () => {
      this.onDelayHover(e);
    }, this.popoverHoverOpenDelay);
  }

  async onDelayHover(e: MouseEvent) {
    // The link blot extends inline blot
    const blot: InlineBlot = Quill.find(this);
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
      this._updateLink(blot, link, isUpdateText ? newText : undefined);
      return;
    }
    if (linkState.type === 'remove') {
      assertExists(blot);
      this._updateLink(blot, false);
      return;
    }
  }

  /**
   * If no pass text, use the original text
   */
  private async _updateLink(
    blot: InlineBlot,
    link: string | false,
    text?: string
  ) {
    const model = getModelByElement(this);
    const { page: page } = model;

    if (text) {
      // Replace the text
      // Save the blot's index otherwise it will be lost after the blot is removed
      const offset = blot.offset();
      page.captureSync();
      // TODO save the format of the original text
      // for make a distinction between user type in and set
      model.text?.delete(offset, blot.length());
      model.text?.insert(text, offset);
      model.text?.format(offset, text.length, { link });
    } else {
      page.captureSync();
      model.text?.format(blot.offset(), blot.length(), { link });
    }
  }

  private async _onHoverEnd(e: Event) {
    clearTimeout(this.popoverTimer);
  }

  render() {
    return html`<a
      href=${this.href}
      rel="noopener noreferrer"
      target="_blank"
      style="white-space: nowrap;"
      >${FontLinkIcon}<slot style="white-space: normal;"></slot
    ></a>`;
  }
}

// See https://github.com/quilljs/quill/blob/develop/formats/link.ts
const Link = Quill.import('formats/link');
Link.tagName = 'link-node'; // Quill uses <a> by default
Link.PROTOCOL_WHITELIST = ALLOWED_SCHEMES;
Quill.register(Link, true);

declare global {
  interface HTMLElementTagNameMap {
    'link-node': LinkNodeComponent;
  }
}
