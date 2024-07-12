import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockComponent } from '../bookmark-block.js';

import { OpenIcon, WebIcon16 } from '../../_common/icons/text.js';
import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import { getEmbedCardIcons, getHostName } from '../../_common/utils/url.js';
import { styles } from '../styles.js';

@customElement('bookmark-card')
export class BookmarkCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  private readonly _themeObserver = new ThemeObserver();

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.bookmark.isInSurface) {
      this._selectBlock();
    }
  }

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    this.bookmark.open();
  }

  private _selectBlock() {
    const selectionManager = this.bookmark.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.bookmark.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this.disposables.add(
      this.bookmark.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());

    this.disposables.add(
      this.bookmark.selection.slots.changed.on(() => {
        this._isSelected =
          !!this.bookmark.selected?.is('block') ||
          !!this.bookmark.selected?.is('surface');
      })
    );
  }

  override render() {
    const { description, icon, image, style, title, url } = this.bookmark.model;

    const cardClassMap = classMap({
      error: this.error,
      loading: this.loading,
      selected: this._isSelected,
      [style]: true,
    });

    const domainName = url.match(
      /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im
    )?.[1];

    const titleText = this.loading
      ? 'Loading...'
      : !title
        ? this.error
          ? domainName ?? 'Link card'
          : ''
        : title;

    const { EmbedCardBannerIcon, LoadingIcon } = getEmbedCardIcons();

    const titleIconType =
      !icon?.split('.').pop() || icon?.split('.').pop() === 'svg'
        ? 'svg+xml'
        : icon?.split('.').pop();

    const titleIcon = this.loading
      ? LoadingIcon
      : icon
        ? html`<object
            type="image/${titleIconType}"
            data=${icon}
            draggable="false"
          >
            ${WebIcon16}
          </object>`
        : WebIcon16;

    const descriptionText = this.loading
      ? ''
      : !description
        ? this.error
          ? 'Failed to retrieve link information.'
          : url
        : description ?? '';

    const bannerImage =
      !this.loading && image
        ? html`<object type="image/webp" data=${image} draggable="false">
            ${EmbedCardBannerIcon}
          </object>`
        : EmbedCardBannerIcon;

    return html`
      <div
        class="affine-bookmark-card ${cardClassMap}"
        @click=${this._handleClick}
        @dblclick=${this._handleDoubleClick}
      >
        <div class="affine-bookmark-content">
          <div class="affine-bookmark-content-title">
            <div class="affine-bookmark-content-title-icon">${titleIcon}</div>
            <div class="affine-bookmark-content-title-text">${titleText}</div>
          </div>
          <div class="affine-bookmark-content-description">
            ${descriptionText}
          </div>
          <div class="affine-bookmark-content-url" @click=${this.bookmark.open}>
            <span>${getHostName(url)}</span>
            <div class="affine-bookmark-content-url-icon">${OpenIcon}</div>
          </div>
        </div>
        <div class="affine-bookmark-banner">${bannerImage}</div>
      </div>
    `;
  }

  @state()
  private accessor _isSelected = false;

  @property({ attribute: false })
  accessor bookmark!: BookmarkBlockComponent;

  @property({ attribute: false })
  accessor error!: boolean;

  @property({ attribute: false })
  accessor loading!: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card': BookmarkCard;
  }
}
