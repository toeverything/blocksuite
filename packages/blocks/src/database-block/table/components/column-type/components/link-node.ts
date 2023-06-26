import { FontLinkIcon } from '@blocksuite/global/config';
import { ShadowlessElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { isValidLink } from '../../../../../components/link-popover/link-popover.js';

@customElement('affine-database-link-node')
export class LinkNode extends ShadowlessElement {
  static override styles = css`
    .link-node {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-link-color);
      fill: var(--affine-link-color);
      text-decoration: none;
      cursor: pointer;
      font-weight: normal;
      font-style: normal;
      text-decoration: none;
    }
  `;

  @property({ attribute: false })
  link!: string;

  protected override render() {
    if (!isValidLink(this.link)) {
      return html`<span class="normal-text">${this.link}</span>`;
    }

    return html`<a
      class="link-node"
      href=${this.link}
      rel="noopener noreferrer"
      target="_blank"
      >${FontLinkIcon}<span>${this.link}</span></a
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-link-node': LinkNode;
  }
}
