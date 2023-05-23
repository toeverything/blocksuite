import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import type { BookmarkProps } from './bookmark-model.js';
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
      margin-top: calc(var(--affine-paragraph-space) + 8px);
    }
    .affine-bookmark-banner {
      width: 140px;
      height: 96px;
    }
    .affine-bookmark-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .affine-bookmark-content-wrapper {
      flex-grow: 1;
      overflow: hidden;
    }
    .affine-bookmark-title {
      height: 18px;
      display: flex;
      align-items: center;
      font-size: var(--affine-font-sm);
      font-weight: 600;
    }
    .affine-bookmark-icon {
      width: 18px;
      height: 18px;
      margin-right: 4px;
      color: var(--affine-text-secondary-color);
    }
    .affine-bookmark-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .affine-bookmark-description {
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
      margin-top: 2px;
    }
  `;

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:bookmark', BookmarkBlockService);
    // @ts-ignore
    if (window?.apis?.ui?.getBookmarkDataByLink) {
      // This method is get website's metaData by link
      // And only exists in the AFFiNE client
      // @ts-ignore
      window.apis.ui
        .getBookmarkDataByLink(this.model.url)
        .then((data: BookmarkProps) => {
          this.model.page.updateBlock(this.model, {
            ...data,
            url: this.model.url,
          });
        });
    }
  }

  override render() {
    const { url, title, description, icon, image } = this.model;
    return html`<a
      href="${url}"
      target="_blank"
      class=${`affine-bookmark-block-container`}
    >
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon ? html`<img src="${icon}" alt="icon" />` : DefaultIcon}
          </div>
          ${title || 'Bookmark'}
        </div>

        <div class="affine-bookmark-description">${description || url}</div>
        <div class="affine-bookmark-link">${url}</div>
      </div>
      <div class="affine-bookmark-banner">
        ${image ? html`<img src="${image}" alt="image" />` : DefaultBanner}
      </div>
    </a> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
