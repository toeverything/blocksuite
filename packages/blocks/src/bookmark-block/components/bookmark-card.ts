import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { OpenIcon, WebIcon16 } from '../../_common/icons/text.js';
import { ThemeObserver } from '../../_common/theme/theme-observer.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import { styles } from '../styles.js';
import { getBookmarkDefaultImages } from './config.js';

@customElement('bookmark-card')
export class BookmarkCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @state()
  bookmark!: BookmarkBlockComponent;

  private readonly _themeObserver = new ThemeObserver();

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

    this._themeObserver.observe(document.documentElement);
    this._themeObserver.on(() => this.requestUpdate());
    this.disposables.add(() => this._themeObserver.dispose());
  }

  private _selectBlock() {
    const selectionManager = this.bookmark.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.bookmark.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _openLink(event: MouseEvent) {
    event.stopPropagation();
    let link = this.bookmark.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  }

  override render() {
    const { url, description, icon, image } = this.bookmark.model;

    const loading = this.bookmark.loading;
    const style = this.bookmark.model.style;
    const cardClassMap = classMap({
      loading,
      [style]: true,
    });

    const title = this.bookmark.model.title ?? 'Bookmark';
    const titleText = loading ? 'Loading...' : title;

    const { LoadingIcon, BannerImage } = getBookmarkDefaultImages();

    const titleIconType =
      !icon?.split('.').pop() || icon?.split('.').pop() === 'svg'
        ? 'svg+xml'
        : icon?.split('.').pop();

    const titleIcon = loading
      ? LoadingIcon
      : icon
        ? html`<object type="image/${titleIconType}" data=${icon}>
            ${WebIcon16}
          </object>`
        : WebIcon16;

    const bannerImage = image
      ? html`<object type="image/webp" data=${image}>${BannerImage}</object>`
      : BannerImage;

    return html`<div
      class="affine-bookmark-card${cardClassMap}"
      @click=${this._selectBlock}
      @dblclick=${this._openLink}
    >
      <div class="affine-bookmark-content">
        <div class="affine-bookmark-content-title">
          <div class="affine-bookmark-content-title-icon">${titleIcon}</div>
          <div class="affine-bookmark-content-title-text">${titleText}</div>
        </div>
        <div class="affine-bookmark-content-description">${description}</div>
        <div class="affine-bookmark-content-url">
          <span>${url}</span>
          <div
            class="affine-bookmark-content-url-icon"
            @click=${this._openLink}
          >
            ${OpenIcon}
          </div>
        </div>
      </div>
      <div class="affine-bookmark-banner">${bannerImage}</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-card': BookmarkCard;
  }
}
