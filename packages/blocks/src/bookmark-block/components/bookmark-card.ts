import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { WebIcon16 } from '../../_common/icons/text.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import { BookmarkDefaultImage } from './bookmark-default-image.js';

@customElement('bookmark-card')
export class BookmarkCard extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-bookmark-card {
      display: grid;
      width: 100%;
      height: 114px;
      padding: 12px;
      align-items: flex-start;
      gap: 12px;
      grid-template-columns: minmax(0, 1fr) 140px;

      border-radius: 8px;
      border: 1px solid var(--affine-background-tertiary-color, #eee);
      opacity: var(--add, 1);
      background: var(--affine-background-primary-color, #fff);
      box-shadow: var(--affine-shadow-1);
    }

    .affine-bookmark-banner {
      width: 140px;
      height: 101px;

      border-radius: 4px 4px 0 0;
      opacity: var(--add, 1);
      overflow: hidden;
    }
    .affine-bookmark-banner.shadow {
      box-shadow: var(--affine-shadow-1);
    }
    .affine-bookmark-banner img,
    .affine-bookmark-banner object,
    .affine-bookmark-banner svg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .affine-bookmark-content {
      display: grid;
      padding: var(--1, 0px);
      gap: 4px;
      grid-template-rows: 22px 40px 20px;

      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
    }
    .affine-bookmark-content-title {
      display: flex;
      padding: var(--1, 0px);
      align-items: center;
      gap: 8px;
      align-self: stretch;

      border-radius: var(--1, 0px);
      opacity: var(--add, 1);
    }
    .affine-bookmark-content-description {
      display: -webkit-box;

      white-space: pre-wrap;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      color: var(--affine-text-primary-color, #121212);

      font-family: Inter;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
    }
    .affine-bookmark-content-url {
      max-height: 20px;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--affine-text-secondary-color, #8e8d91);
      font-family: Inter;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
    }

    .affine-bookmark-content-title-icon {
      display: flex;
      width: 16px;
      height: 16px;
      justify-content: center;
      align-items: center;
    }
    .affine-bookmark-content-title-text {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      flex: 1 0 0;

      overflow: hidden;
      color: var(--affine-text-primary-color, #121212);
      text-overflow: ellipsis;

      font-family: Inter;
      font-size: 14px;
      font-style: normal;
      font-weight: 600;
      line-height: 22px;
    }

    .affine-bookmark-content-title-icon img,
    .affine-bookmark-content-title-icon object,
    .affine-bookmark-content-title-icon svg {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .affine-bookmark-content-title-text.loading {
      color: var(--light-detail-color-placeholder-color, #c0bfc1);

      font-family: Inter;
      font-size: 14px;
      font-style: normal;
      font-weight: 600;
      line-height: 22px;
    }

    @keyframes loading {
      0% {
        transform: rotate(0);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .affine-bookmark-content-title-icon.loading {
      animation: loading 1s linear infinite;
      stroke-dashoffset: 0;
      stroke-dasharray: 300;
      stroke-width: 15;
      stroke-miterlimit: 10;
      stroke-linecap: round;
      stroke: var(--loader-color);
      fill: transparent;
    }
  `;

  @state()
  bookmark!: BookmarkBlockComponent;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.bookmark.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this.disposables.add(
      this.bookmark.slots.loadingUpdated.on(() => this.requestUpdate())
    );
  }

  private _onCardClick() {
    const selectionManager = this.bookmark.host.selection;
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
    const { url, description = url, icon, image } = this.bookmark.model;
    const title = this.bookmark.model.title ?? 'Bookmark';
    const loading = this.bookmark.loading;

    const titleIconClasses = classMap({
      'affine-bookmark-content-title-icon': true,
      loading,
    });
    const titleTextClasses = classMap({
      'affine-bookmark-content-title-text': true,
      loading,
    });

    const iconType =
      !icon?.split('.').pop() || icon?.split('.').pop() === 'svg'
        ? 'svg+xml'
        : icon?.split('.').pop();

    return html`<div
      class="affine-bookmark-card"
      @click=${this._onCardClick}
      @dblclick=${this._onCardDbClick}
    >
      <div class="affine-bookmark-content">
        <div class="affine-bookmark-content-title">
          <div class=${titleIconClasses}>
            ${this.bookmark.loading
              ? loadingIcon
              : icon
                ? html`<object type="image/${iconType}" data=${icon}>
                    ${WebIcon16}
                  </object>`
                : WebIcon16}
          </div>
          <div class=${titleTextClasses}>
            ${this.bookmark.loading ? 'Loading...' : title}
          </div>
        </div>
        <div class="affine-bookmark-content-description">${description}</div>
        <div class="affine-bookmark-content-url">${url}</div>
      </div>
      <div class="affine-bookmark-banner">
        ${image
          ? html`<object type="image/webp" data=${image}>
              ${BookmarkDefaultImage()}
            </object>`
          : BookmarkDefaultImage()}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card': BookmarkCard;
  }
}

const loadingIcon = html`<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_6492_6903)">
    <path
      d="M14.6668 8.00004C14.6668 11.6819 11.6821 14.6667 8.00016 14.6667C4.31826 14.6667 1.3335 11.6819 1.3335 8.00004C1.3335 4.31814 4.31826 1.33337 8.00016 1.33337C11.6821 1.33337 14.6668 4.31814 14.6668 8.00004ZM3.30027 8.00004C3.30027 10.5957 5.40449 12.6999 8.00016 12.6999C10.5958 12.6999 12.7001 10.5957 12.7001 8.00004C12.7001 5.40436 10.5958 3.30015 8.00016 3.30015C5.40449 3.30015 3.30027 5.40436 3.30027 8.00004Z"
      fill="black"
      fill-opacity="0.1"
    />
    <path
      d="M13.6835 8.00004C14.2266 8.00004 14.6743 7.55745 14.5944 7.02026C14.5144 6.48183 14.3686 5.954 14.1594 5.44882C13.8243 4.63998 13.3333 3.90505 12.7142 3.286C12.0952 2.66694 11.3602 2.17588 10.5514 1.84084C10.0462 1.63159 9.51837 1.48576 8.97994 1.40576C8.44276 1.32595 8.00016 1.77363 8.00016 2.31671C8.00016 2.85979 8.44511 3.28974 8.97634 3.40253C9.25705 3.46214 9.53238 3.54746 9.79877 3.65781C10.369 3.894 10.8871 4.2402 11.3236 4.67664C11.76 5.11307 12.1062 5.6312 12.3424 6.20143C12.4527 6.46782 12.5381 6.74315 12.5977 7.02386C12.7105 7.5551 13.1404 8.00004 13.6835 8.00004Z"
      fill="#1E96EB"
    />
  </g>
  <defs>
    <clipPath id="clip0_6492_6903">
      <rect width="16" height="16" fill="white" />
    </clipPath>
  </defs>
</svg> `;
