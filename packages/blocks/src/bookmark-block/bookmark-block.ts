/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { attributeRenderer } from '../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineTextSchema,
} from '../__internal__/rich-text/virgo/types.js';
import { registerService } from '../__internal__/service.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { BookmarkBlockService } from './bookmark-service.js';
import { DefaultBanner } from './images/banners.js';
import { DefaultIcon } from './images/icons.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  static override styles = css`
    .affine-bookmark-block-container {
      width: 100%;
      height: 112px;
      background: linear-gradient(180deg, #f0f3fd 0%, #fcfcfd 100%);
      border: 3px solid #fcfcfd;
      box-shadow: 0 0 4px rgba(66, 65, 73, 0.14);
      border-radius: 12px;
      padding: 16px 24px;
      display: flex;
      cursor: pointer;
      text-decoration: none;
      color: var(--affine-text-primary-color);
      overflow: hidden;
      line-height: calc(1em + 4px);
    }
    .affine-bookmark-banner {
      width: 140px;
      height: 96px;
    }
    .affine-bookmark-content-wrapper {
      flex-grow: 1;
      overflow: hidden;
    }
    .affine-bookmark-title {
      display: flex;
      align-items: center;
      font-size: var(--affine-font-sm);
      font-weight: 600;
    }
    .affine-bookmark-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      color: var(--affine-text-secondary-color);
    }
    .affine-bookmark-summary {
      height: 32px;
      line-height: 16px;
      margin-top: 4px;
      font-size: var(--affine-font-xs);

      display: -webkit-box;
      word-break: break-all;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .affine-bookmark-link {
      font-size: var(--affine-font-xs);
      color: var(--affine-text-secondary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  readonly textSchema: AffineTextSchema = {
    attributesSchema: affineTextAttributes,
    textRenderer: attributeRenderer,
  };

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:bookmark', BookmarkBlockService);
  }

  override render() {
    const { link, title, summary, icon, banner } = this.model;
    return html`<a
      href="${link}"
      target="_blank"
      class=${`affine-bookmark-block-container`}
    >
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">${icon || DefaultIcon}</div>
          ${title || 'Bookmark'}
        </div>

        <div class="affine-bookmark-summary">${summary || link}</div>
        <div class="affine-bookmark-link">${link}</div>
      </div>
      <div class="affine-bookmark-banner">${banner || DefaultBanner}</div>
    </a> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
