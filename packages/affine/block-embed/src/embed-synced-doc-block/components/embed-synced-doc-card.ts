import { isGfxBlockComponent, ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { property, queryAsync } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedSyncedDocBlockComponent } from '../embed-synced-doc-block.js';

import { renderLinkedDocInCard } from '../../common/render-linked-doc.js';
import { cardStyles } from '../styles.js';
import { getSyncedDocIcons } from '../utils.js';

export class EmbedSyncedDocCard extends WithDisposable(ShadowlessElement) {
  static override styles = cardStyles;

  private _dragging = false;

  cleanUpSurfaceRefRenderer = () => {
    if (this.surfaceRefRenderer) {
      this.surfaceRefService.removeRenderer(this.surfaceRefRenderer.id);
    }
  };

  get blockState() {
    return this.block.blockState;
  }

  get editorMode() {
    return this.block.editorMode;
  }

  get host() {
    return this.block.host;
  }

  get linkedDoc() {
    return this.block.syncedDoc;
  }

  get model() {
    return this.block.model;
  }

  get std() {
    return this.block.std;
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (!isGfxBlockComponent(this.block)) {
      this._selectBlock();
    }
  }

  private _isDocEmpty() {
    const syncedDoc = this.block.syncedDoc;
    if (!syncedDoc) {
      return false;
    }
    return (
      !!syncedDoc &&
      !syncedDoc.meta?.title.length &&
      this.isNoteContentEmpty &&
      this.isBannerEmpty
    );
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.block.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.block.handleEvent(
      'dragStart',
      () => {
        this._dragging = true;
      },
      { global: true }
    );
    this.block.handleEvent(
      'dragEnd',
      () => {
        this._dragging = false;
      },
      { global: true }
    );

    const { isCycle } = this.block.blockState;
    const syncedDoc = this.block.syncedDoc;
    if (isCycle && syncedDoc) {
      if (syncedDoc.root) {
        renderLinkedDocInCard(this);
      } else {
        syncedDoc.slots.rootAdded.once(() => {
          renderLinkedDocInCard(this);
        });
      }

      this.disposables.add(
        syncedDoc.collection.meta.docMetaUpdated.on(() => {
          renderLinkedDocInCard(this);
        })
      );
      this.disposables.add(
        syncedDoc.slots.blockUpdated.on(payload => {
          if (this._dragging) {
            return;
          }
          if (
            payload.type === 'update' &&
            ['', 'caption', 'xywh'].includes(payload.props.key)
          ) {
            return;
          }
          renderLinkedDocInCard(this);
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

    const isEmpty = this._isDocEmpty() && this.isBannerEmpty;

    const cardClassMap = classMap({
      loading: isLoading,
      error,
      deleted: isDeleted,
      cycle: isCycle,
      surface: isGfxBlockComponent(this.block),
      empty: isEmpty,
      'banner-empty': this.isBannerEmpty,
      'note-empty': this.isNoteContentEmpty,
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
    } = getSyncedDocIcons(this.editorMode);

    const titleIcon = error
      ? SyncedDocErrorIcon
      : isLoading
        ? LoadingIcon
        : isDeleted
          ? SyncedDocDeletedIcon
          : SyncedDocIcon;

    const titleText = error
      ? this.block.docTitle
      : isLoading
        ? 'Loading...'
        : isDeleted
          ? `Deleted doc`
          : this.block.docTitle;

    const showDefaultNoteContent = isLoading || error || isDeleted || isEmpty;
    const defaultNoteContent = error
      ? 'This linked doc failed to load.'
      : isLoading
        ? ''
        : isDeleted
          ? 'This linked doc is deleted.'
          : isEmpty
            ? 'Preview of the page will be displayed here.'
            : '';

    const dateText = this.block.docUpdatedAt.toLocaleString();

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
        class="affine-embed-synced-doc-card ${cardClassMap}"
        @click=${this._handleClick}
      >
        <div class="affine-embed-synced-doc-card-content">
          <div class="affine-embed-synced-doc-card-content-title">
            <div class="affine-embed-synced-doc-card-content-title-icon">
              ${titleIcon}
            </div>

            <div class="affine-embed-synced-doc-card-content-title-text">
              ${titleText}
            </div>
          </div>

          ${showDefaultNoteContent
            ? html`<div class="affine-embed-synced-doc-content-note default">
                ${defaultNoteContent}
              </div>`
            : nothing}
          <div class="affine-embed-synced-doc-content-note render"></div>

          ${error
            ? html`
                <div class="affine-embed-synced-doc-card-content-reload">
                  <div
                    class="affine-embed-synced-doc-card-content-reload-button"
                    @click=${() => this.block.refreshData()}
                  >
                    ${ReloadIcon} <span>Reload</span>
                  </div>
                </div>
              `
            : html`
                <div class="affine-embed-synced-doc-card-content-date">
                  <span>Updated</span>

                  <span>${dateText}</span>
                </div>
              `}
        </div>

        <div class="affine-embed-synced-doc-card-banner render"></div>

        ${showDefaultBanner
          ? html`
              <div class="affine-embed-synced-doc-card-banner default">
                ${defaultBanner}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  @queryAsync('.affine-embed-synced-doc-card-banner.render')
  accessor bannerContainer!: Promise<HTMLDivElement>;

  @property({ attribute: false })
  accessor block!: EmbedSyncedDocBlockComponent;

  @property({ attribute: false })
  accessor isBannerEmpty = false;

  @property({ attribute: false })
  accessor isError = false;

  @property({ attribute: false })
  accessor isNoteContentEmpty = false;

  @queryAsync('.affine-embed-synced-doc-content-note.render')
  accessor noteContainer!: Promise<HTMLDivElement>;

  @property({ attribute: false })
  // TODO: remove any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor surfaceRefRenderer: any | null = null;

  @property({ attribute: false })
  // TODO: remove any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor surfaceRefService!: any;
}
