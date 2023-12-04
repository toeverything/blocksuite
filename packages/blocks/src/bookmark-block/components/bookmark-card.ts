import { ShadowlessElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { WebIcon16 } from '../../_common/icons/text.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import { embedIframeTemplate } from '../embed.js';
import { DefaultBanner } from '../images/banners.js';

@customElement('bookmark-card')
export class BookmarkCard extends ShadowlessElement {
  static override styles = css`
    .affine-bookmark-block-container {
      width: 100%;
      margin-top: 18px;
      margin-bottom: 18px;
      position: relative;
    }
    .affine-bookmark-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--affine-shadow-1);
      border: 3px solid var(--affine-background-secondary-color);
      border-radius: 12px;
      padding: 16px 24px;
      cursor: pointer;
      text-decoration: none;
      color: var(--affine-text-primary-color);
      overflow: hidden;
      line-height: calc(1em + 4px);
      position: relative;
    }
    .affine-bookmark-banner {
      position: absolute;
      right: 24px;
      bottom: 0;
      width: 140px;
      height: 93px;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
    }
    .affine-bookmark-banner.shadow {
      box-shadow: var(--affine-shadow-1);
    }

    .affine-bookmark-banner img,
    .affine-bookmark-banner svg {
      width: 140px;
      height: 93px;
      object-fit: cover;
    }
    .affine-bookmark-content-wrapper {
      width: 100%;
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
    .affine-bookmark-title-content {
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-left: 8px;
    }
    .affine-bookmark-icon {
      display: flex;
      align-items: center;
      width: 18px;
      height: 18px;
      color: var(--affine-text-secondary-color);
      fill: var(--affine-text-secondary-color);
      flex-shrink: 0;
    }
    .affine-bookmark-icon img,
    .affine-bookmark-icon svg {
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
    .affine-bookmark-url {
      font-size: var(--affine-font-xs);
      color: var(--affine-text-secondary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }

    .affine-bookmark-embed-frame {
      grid-area: embed;
      width: 100%;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
    }
  `;

  @state()
  bookmark!: BookmarkBlockComponent;

  private _onCardClick() {
    const selectionManager = this.bookmark.root.selection;
    const blockSelection = selectionManager.getInstance('block', {
      path: this.bookmark.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _onCardDbClick() {
    let link = this.bookmark.model.url;

    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  override render() {
    const { url, description = url, icon, image, type } = this.bookmark.model;
    const title =
      this.bookmark.model.title ??
      this.bookmark.model.bookmarkTitle ??
      'Bookmark';
    const isEmbed = type === 'embed';

    return html`<div
      class="affine-bookmark-link"
      style="${isEmbed
        ? nothing
        : 'background: var(--affine-card-background-blue);'}"
      @click=${this._onCardClick}
      @dblclick=${this._onCardDbClick}
    >
      ${isEmbed
        ? html`<div class="affine-bookmark-embed-frame">
            ${embedIframeTemplate(url)}
          </div>`
        : nothing}
      <div
        class="affine-bookmark-content-wrapper"
        style="${isEmbed ? nothing : 'padding-right: 165px;'}"
      >
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon ? html`<img src=${icon} />` : WebIcon16}
          </div>
          <div class="affine-bookmark-title-content">${title}</div>
        </div>
        <div class="affine-bookmark-description">${description}</div>
        <div class="affine-bookmark-url">${url}</div>
      </div>
      ${isEmbed
        ? nothing
        : html`<div class="affine-bookmark-banner ${image ? 'shadow' : ''}">
            ${image ? html`<img src=${image} />` : DefaultBanner}
          </div>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card': BookmarkCard;
  }
}
