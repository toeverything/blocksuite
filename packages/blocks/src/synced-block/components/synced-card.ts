import '../../_common/components/block-selection.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, queryAsync } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { renderDocInCard } from '../../embed-linked-doc-block/utils.js';
import type { SurfaceRefRenderer } from '../../surface-ref-block/surface-ref-renderer.js';
import type { SurfaceRefBlockService } from '../../surface-ref-block/surface-ref-service.js';
import { cardStyles } from '../styles.js';
import type { SyncedBlockComponent } from '../synced-block.js';
import { getSyncedDocIcons } from '../utils.js';

@customElement('affine-synced-card')
export class SyncedCard extends WithDisposable(ShadowlessElement) {
  static override styles = cardStyles;

  @property({ attribute: false })
  block!: SyncedBlockComponent;

  @property({ attribute: false })
  isError = false;

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

  get pageMode() {
    return this.block.pageMode;
  }

  get blockState() {
    return this.block.blockState;
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

    const { isCycle } = this.block.blockState;
    const syncedDoc = this.doc;
    if (isCycle && syncedDoc) {
      if (syncedDoc.root) {
        renderDocInCard(this, syncedDoc);
      } else {
        syncedDoc.slots.rootAdded.once(() => {
          renderDocInCard(this, syncedDoc);
        });
      }

      this.disposables.add(
        syncedDoc.workspace.meta.pageMetasUpdated.on(() => {
          renderDocInCard(this, syncedDoc);
        })
      );
      this.disposables.add(
        syncedDoc.slots.blockUpdated.on(payload => {
          if (
            payload.type === 'update' &&
            ['xywh', 'caption', ''].includes(payload.props.key)
          ) {
            return;
          }
          renderDocInCard(this, syncedDoc);
        })
      );
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanUpSurfaceRefRenderer();
  }

  override render() {
    const { isLoading, isDeleted, isError, isCycle } = this.blockState;
    const error = this.isError || isError;

    const isEmpty = this._isPageEmpty() && this.isBannerEmpty;

    const cardClassMap = classMap({
      loading: isLoading,
      error,
      deleted: isDeleted,
      cycle: isCycle,
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

    const titleIcon = isLoading
      ? LoadingIcon
      : error
        ? SyncedDocErrorIcon
        : isDeleted
          ? SyncedDocDeletedIcon
          : SyncedDocIcon;

    const titleText = isLoading
      ? 'Loading...'
      : isDeleted
        ? `Deleted doc`
        : this.block.pageTitle;

    const descriptionText = isLoading
      ? ''
      : error
        ? 'This linked doc failed to load.'
        : isDeleted
          ? 'This linked doc is deleted.'
          : isEmpty
            ? 'Preview of the linked doc will be displayed here.'
            : this.abstractText;

    const dateText = this.block.pageUpdatedAt.toLocaleTimeString();

    const showDefaultBanner = isLoading || error || isDeleted || isEmpty;

    const defaultBanner = isLoading
      ? SyncedDocEmptyBanner
      : error
        ? SyncedDocErrorBanner
        : isDeleted
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

          ${error
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
    'affine-synced-card': SyncedCard;
  }
}
