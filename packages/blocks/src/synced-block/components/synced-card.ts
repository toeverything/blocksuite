import '../../_common/components/block-selection.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, queryAsync } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { renderDoc } from '../../embed-linked-doc-block/utils.js';
import type { SurfaceRefRenderer } from '../../surface-ref-block/surface-ref-renderer.js';
import type { SurfaceRefBlockService } from '../../surface-ref-block/surface-ref-service.js';
import { cardStyles } from '../styles.js';
import type { SyncedBlockComponent } from '../synced-block.js';
import { getSyncedDocIcons } from '../utils.js';

@customElement('synced-card')
export class SyncedCard extends WithDisposable(ShadowlessElement) {
  static override styles = cardStyles;

  @property({ attribute: false })
  block!: SyncedBlockComponent;

  @property({ attribute: false })
  pageMode!: 'page' | 'edgeless';

  @property({ attribute: false })
  pageUpdatedAt!: Date;

  @property({ attribute: false })
  isLoading!: boolean;

  @property({ attribute: false })
  isError!: boolean;

  @property({ attribute: false })
  isDeleted!: boolean;

  @property({ attribute: false })
  isCycle!: boolean;

  @property({ attribute: false })
  abstractText = '';

  @property({ attribute: false })
  isBannerEmpty = false;

  @property({ attribute: false })
  surfaceRefService!: SurfaceRefBlockService;

  @property({ attribute: false })
  surfaceRefRenderer?: SurfaceRefRenderer;

  @queryAsync('.affine-synced-card-banner.render')
  bannerContainer!: Promise<HTMLDivElement>;

  get std() {
    return this.block.std;
  }

  get host() {
    return this.block.host;
  }

  get model() {
    return this.block.model;
  }

  get path() {
    return this.block.path;
  }

  get doc() {
    return this.block.doc;
  }

  private _isPageEmpty() {
    const linkedDoc = this.doc;
    if (!linkedDoc) {
      return false;
    }
    return (
      !!linkedDoc && !linkedDoc.meta.title.length && !this.abstractText.length
    );
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.block.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!this.block.isInSurface) {
      this._selectBlock();
    }
  }

  cleanUpSurfaceRefRenderer = () => {
    if (this.surfaceRefRenderer) {
      this.surfaceRefService.removeRenderer(this.surfaceRefRenderer.id);
    }
  };

  override connectedCallback() {
    super.connectedCallback();

    const syncedDoc = this.doc;
    if (this.isCycle && syncedDoc) {
      renderDoc(this, syncedDoc);

      this.disposables.add(
        syncedDoc.workspace.meta.pageMetasUpdated.on(() =>
          renderDoc(this, syncedDoc)
        )
      );
      this.disposables.add(
        syncedDoc.slots.blockUpdated.on(() => renderDoc(this, syncedDoc))
      );
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanUpSurfaceRefRenderer();
  }

  override render() {
    const isEmpty = this._isPageEmpty() && this.isBannerEmpty;

    const cardClassMap = classMap({
      loading: this.isLoading,
      error: this.isError,
      deleted: this.isDeleted,
      cycle: this.isCycle,
      surface: this.block.isInSurface,
      empty: isEmpty,
      'banner-empty': this.isBannerEmpty,
    });

    const {
      LoadingIcon,
      SyncedDocIcon,
      SyncedDocErrorIcon,
      SyncedDocDeletedIcon,
      ReloadIcon,
      SyncedDocEmptyBanner,
      SyncedDocErrorBanner,
      SyncedDocDeletedBanner,
    } = getSyncedDocIcons(this.pageMode);

    const titleIcon = this.isLoading
      ? LoadingIcon
      : this.isError
        ? SyncedDocErrorIcon
        : this.isDeleted
          ? SyncedDocDeletedIcon
          : SyncedDocIcon;

    const titleText = this.isLoading
      ? 'Loading...'
      : this.isDeleted
        ? `Deleted doc`
        : this.block.pageTitle;

    const descriptionText = this.isLoading
      ? ''
      : this.isError
        ? 'This linked doc failed to load.'
        : this.isDeleted
          ? 'This linked doc is deleted.'
          : isEmpty
            ? 'Preview of the linked doc will be displayed here.'
            : this.abstractText;

    const dateText = this.pageUpdatedAt.toLocaleTimeString();

    const showDefaultBanner =
      this.isLoading || this.isError || this.isDeleted || isEmpty;

    const defaultBanner = this.isError
      ? SyncedDocErrorBanner
      : this.isDeleted
        ? SyncedDocDeletedBanner
        : SyncedDocEmptyBanner;

    return html`
      <div
        class="affine-synced-card ${cardClassMap}"
        @click=${this._handleClick}
      >
        <div class="affine-synced-card-content">
          <div class="affine-synced-card-content-title">
            <div class="affine-synced-card-content-title-icon">
              ${titleIcon}
            </div>

            <div class="affine-synced-card-content-title-text">
              ${titleText}
            </div>
          </div>

          <div class="affine-synced-card-content-description">
            ${descriptionText}
          </div>

          ${this.isError
            ? html`
                <div class="affine-synced-card-content-reload">
                  <div
                    class="affine-synced-card-content-reload-button"
                    @click=${() => this.block.refreshData()}
                  >
                    ${ReloadIcon} <span>Reload</span>
                  </div>
                </div>
              `
            : html`
                <div class="affine-synced-card-content-date">
                  <span>Updated</span>

                  <span>${dateText}</span>
                </div>
              `}
        </div>

        <div class="affine-synced-card-banner render"></div>

        ${showDefaultBanner
          ? html`
              <div class="affine-synced-card-banner default">
                ${defaultBanner}
              </div>
            `
          : nothing}
      </div>

      <affine-block-selection .block=${this.block}></affine-block-selection>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'synced-card': SyncedCard;
  }
}
