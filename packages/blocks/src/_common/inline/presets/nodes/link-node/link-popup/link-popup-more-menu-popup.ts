import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline/types';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { toast } from '../../../../../components/toast.js';
import {
  CopyIcon,
  DeleteIcon,
  OpenIcon,
  UnlinkIcon,
} from '../../../../../icons/index.js';
import type { AffineInlineEditor } from '../../../affine-inline-specs.js';

@customElement('link-popup-more-menu')
export class LinkPopupMoreMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .link-popup-more-menu {
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
    }

    .menu-item:hover {
      background: var(--affine-hover-color);
    }

    .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }
    .menu-item:hover.delete > svg {
      color: var(--affine-error-color);
    }

    .menu-item svg {
      margin: 0 8px;
    }

    .divider {
      width: 148px;
      height: 1px;
      margin: 8px;
      background-color: var(--affine-border-color);
    }
  `;

  @property({ attribute: false })
  inlineEditor!: AffineInlineEditor;

  @property({ attribute: false })
  targetInlineRange!: InlineRange;

  @property({ attribute: false })
  abortController!: AbortController;

  get currentLink() {
    const link = this.inlineEditor.getFormat(this.targetInlineRange).link;
    assertExists(link);
    return link;
  }

  private _openLink() {
    let link = this.currentLink;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
    this.abortController.abort();
  }

  private _copyUrl() {
    navigator.clipboard.writeText(this.currentLink).catch(console.error);
    toast('Copied link to clipboard');
    this.abortController.abort();
  }

  private _removeLink() {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.formatText(this.targetInlineRange, {
        link: null,
      });
    }
    this.abortController.abort();
  }

  private _delete() {
    if (this.inlineEditor.isValidInlineRange(this.targetInlineRange)) {
      this.inlineEditor.deleteText(this.targetInlineRange);
    }
    this.abortController.abort();
  }

  override render() {
    return html`<div class="link-popup-more-menu">
      <icon-button
        width="126px"
        height="32px"
        class="menu-item open"
        text="Open"
        @click=${() => this._openLink()}
      >
        ${OpenIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item copy"
        text="Copy"
        @click=${() => this._copyUrl()}
      >
        ${CopyIcon}
      </icon-button>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item unlink"
        text="Remove link"
        @click=${() => this._removeLink()}
      >
        ${UnlinkIcon}
      </icon-button>

      <div class="divider"></div>

      <icon-button
        width="126px"
        height="32px"
        class="menu-item delete"
        text="Delete"
        @click=${() => this._delete()}
      >
        ${DeleteIcon}
      </icon-button>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'link-popup-more-menu': LinkPopupMoreMenu;
  }
}
