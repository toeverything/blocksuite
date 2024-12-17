import type {
  DocMode,
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from '@blocksuite/affine-model';

import { isPeekable, Peekable } from '@blocksuite/affine-components/peek';
import {
  REFERENCE_NODE,
  RefNodeSlotsProvider,
} from '@blocksuite/affine-components/rich-text';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  DocDisplayMetaProvider,
  DocModeProvider,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import {
  cloneReferenceInfo,
  cloneReferenceInfoWithoutAliases,
  matchFlavours,
  referenceToNode,
} from '@blocksuite/affine-shared/utils';
import { Bound } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { computed } from '@preact/signals-core';
import { html, nothing } from 'lit';
import { property, queryAsync, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { renderLinkedDocInCard } from '../common/render-linked-doc.js';
import { SyncedDocErrorIcon } from '../embed-synced-doc-block/styles.js';
import {
  type EmbedLinkedDocBlockConfig,
  EmbedLinkedDocBlockConfigIdentifier,
} from './embed-linked-doc-config.js';
import { styles } from './styles.js';
import { getEmbedLinkedDocIcons } from './utils.js';

@Peekable({
  enableOn: ({ doc }: EmbedLinkedDocBlockComponent) => !doc.readonly,
})
export class EmbedLinkedDocBlockComponent extends EmbedBlockComponent<EmbedLinkedDocModel> {
  static override styles = styles;

  private _load = async () => {
    const {
      loading = true,
      isError = false,
      isBannerEmpty = true,
      isNoteContentEmpty = true,
    } = this.getInitialState();

    this._loading = loading;
    this.isError = isError;
    this.isBannerEmpty = isBannerEmpty;
    this.isNoteContentEmpty = isNoteContentEmpty;

    if (!this._loading) {
      return;
    }

    const linkedDoc = this.linkedDoc;
    if (!linkedDoc) {
      this._loading = false;
      return;
    }

    if (!linkedDoc.loaded) {
      try {
        linkedDoc.load();
      } catch (e) {
        console.error(e);
        this.isError = true;
      }
    }

    if (!this.isError && !linkedDoc.root) {
      await new Promise<void>(resolve => {
        linkedDoc.slots.rootAdded.once(() => {
          resolve();
        });
      });
    }

    this._loading = false;

    // If it is a link to a block or element, the content will not be rendered.
    if (this._referenceToNode) {
      return;
    }

    if (!this.isError) {
      const cardStyle = this.model.style;
      if (cardStyle === 'horizontal' || cardStyle === 'vertical') {
        renderLinkedDocInCard(this);
      }
    }
  };

  private _selectBlock = () => {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  };

  private _setDocUpdatedAt = () => {
    const meta = this.doc.collection.meta.getDocMeta(this.model.pageId);
    if (meta) {
      const date = meta.updatedDate || meta.createDate;
      this._docUpdatedAt = new Date(date);
    }
  };

  override _cardStyle: (typeof EmbedLinkedDocStyles)[number] = 'horizontal';

  convertToEmbed = () => {
    if (this._referenceToNode) return;

    const { doc, caption } = this.model;

    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );
    if (!isSyncedDocEnabled) {
      return;
    }

    const parent = doc.getParent(this.model);
    if (!parent) {
      return;
    }
    const index = parent.children.indexOf(this.model);

    doc.addBlock(
      'affine:embed-synced-doc',
      {
        caption,
        ...cloneReferenceInfoWithoutAliases(this.referenceInfo$.peek()),
      },
      parent,
      index
    );

    this.std.selection.setGroup('note', []);
    doc.deleteBlock(this.model);
  };

  covertToInline = () => {
    const { doc } = this.model;
    const parent = doc.getParent(this.model);
    if (!parent) {
      return;
    }
    const index = parent.children.indexOf(this.model);

    const yText = new DocCollection.Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: {
        type: 'LinkedPage',
        ...this.referenceInfo$.peek(),
      },
    });
    const text = new doc.Text(yText);

    doc.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    doc.deleteBlock(this.model);
  };

  referenceInfo$ = computed(() => {
    const { pageId, params, title$, description$ } = this.model;
    return cloneReferenceInfo({
      pageId,
      params,
      title: title$.value,
      description: description$.value,
    });
  });

  icon$ = computed(() => {
    const { pageId, params, title } = this.referenceInfo$.value;
    return this.std
      .get(DocDisplayMetaProvider)
      .icon(pageId, { params, title, referenced: true }).value;
  });

  open = () => {
    this.std
      .getOptional(RefNodeSlotsProvider)
      ?.docLinkClicked.emit(this.referenceInfo$.peek());
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this.isError = true;
    });
  };

  title$ = computed(() => {
    const { pageId, params, title } = this.referenceInfo$.value;
    return (
      title ||
      this.std
        .get(DocDisplayMetaProvider)
        .title(pageId, { params, title, referenced: true })
    );
  });

  get config(): EmbedLinkedDocBlockConfig {
    return (
      this.std.provider.getOptional(EmbedLinkedDocBlockConfigIdentifier) || {}
    );
  }

  get docTitle() {
    return this.model.title || this.linkedDoc?.meta?.title || 'Untitled';
  }

  get editorMode() {
    return this._linkedDocMode;
  }

  get linkedDoc() {
    return this.std.collection.getDoc(this.model.pageId);
  }

  private _handleDoubleClick(event: MouseEvent) {
    if (this.config.handleDoubleClick) {
      this.config.handleDoubleClick(
        event,
        this.host,
        this.referenceInfo$.peek()
      );
      if (event.defaultPrevented) {
        return;
      }
    }

    if (isPeekable(this)) {
      return;
    }
    event.stopPropagation();
    this.open();
  }

  private _isDocEmpty() {
    const linkedDoc = this.linkedDoc;
    if (!linkedDoc) {
      return false;
    }
    return !!linkedDoc && this.isNoteContentEmpty && this.isBannerEmpty;
  }

  protected _handleClick(event: MouseEvent) {
    if (this.config.handleClick) {
      this.config.handleClick(event, this.host, this.referenceInfo$.peek());
      if (event.defaultPrevented) {
        return;
      }
    }

    this._selectBlock();
  }

  override connectedCallback() {
    super.connectedCallback();

    this._cardStyle = this.model.style;
    this._referenceToNode = referenceToNode(this.model);

    this._load().catch(e => {
      console.error(e);
      this.isError = true;
    });

    const linkedDoc = this.linkedDoc;
    if (linkedDoc) {
      this.disposables.add(
        linkedDoc.collection.meta.docMetaUpdated.on(() => {
          this._load().catch(e => {
            console.error(e);
            this.isError = true;
          });
        })
      );
      this.disposables.add(
        linkedDoc.slots.blockUpdated.on(payload => {
          if (
            payload.type === 'update' &&
            ['', 'caption', 'xywh'].includes(payload.props.key)
          ) {
            return;
          }

          if (payload.type === 'add' && payload.init) {
            return;
          }

          this._load().catch(e => {
            console.error(e);
            this.isError = true;
          });
        })
      );

      this._setDocUpdatedAt();
      this.disposables.add(
        this.doc.collection.meta.docMetaUpdated.on(() => {
          this._setDocUpdatedAt();
        })
      );

      if (this._referenceToNode) {
        this._linkedDocMode = this.model.params?.mode ?? 'page';
      } else {
        const docMode = this.std.get(DocModeProvider);
        this._linkedDocMode = docMode.getPrimaryMode(this.model.pageId);
        this.disposables.add(
          docMode.onPrimaryModeChange(mode => {
            this._linkedDocMode = mode;
          }, this.model.pageId)
        );
      }
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        if (key === 'style') {
          this._cardStyle = this.model.style;
        }
        if (key === 'pageId' || key === 'style') {
          this._load().catch(e => {
            console.error(e);
            this.isError = true;
          });
        }
      })
    );
  }

  getInitialState(): {
    loading?: boolean;
    isError?: boolean;
    isNoteContentEmpty?: boolean;
    isBannerEmpty?: boolean;
  } {
    return {};
  }

  override renderBlock() {
    const linkedDoc = this.linkedDoc;
    const isDeleted = !linkedDoc;
    const isLoading = this._loading;
    const isError = this.isError;
    const isEmpty = this._isDocEmpty() && this.isBannerEmpty;
    const inCanvas = matchFlavours(this.model.parent, ['affine:surface']);

    const cardClassMap = classMap({
      loading: isLoading,
      error: isError,
      deleted: isDeleted,
      empty: isEmpty,
      'banner-empty': this.isBannerEmpty,
      'note-empty': this.isNoteContentEmpty,
      'in-canvas': inCanvas,
      [this._cardStyle]: true,
    });

    const theme = this.std.get(ThemeProvider).theme;
    const {
      LoadingIcon,
      ReloadIcon,
      LinkedDocDeletedBanner,
      LinkedDocEmptyBanner,
      SyncedDocErrorBanner,
    } = getEmbedLinkedDocIcons(theme, this._linkedDocMode, this._cardStyle);

    const icon = isError
      ? SyncedDocErrorIcon
      : isLoading
        ? LoadingIcon
        : this.icon$.value;
    const title = isLoading ? 'Loading...' : this.title$;
    const description = this.model.description$;

    const showDefaultNoteContent = isError || isLoading || isDeleted || isEmpty;
    const defaultNoteContent = isError
      ? 'This linked doc failed to load.'
      : isLoading
        ? ''
        : isDeleted
          ? 'This linked doc is deleted.'
          : isEmpty
            ? 'Preview of the doc will be displayed here.'
            : '';

    const dateText =
      this._cardStyle === 'cube'
        ? this._docUpdatedAt.toLocaleTimeString()
        : this._docUpdatedAt.toLocaleString();

    const showDefaultBanner = isError || isLoading || isDeleted || isEmpty;

    const defaultBanner = isError
      ? SyncedDocErrorBanner
      : isLoading
        ? LinkedDocEmptyBanner
        : isDeleted
          ? LinkedDocDeletedBanner
          : LinkedDocEmptyBanner;

    const hasDescriptionAlias = Boolean(description.value);

    return this.renderEmbed(
      () => html`
        <div
          class="affine-embed-linked-doc-block ${cardClassMap}"
          style=${styleMap({
            transform: `scale(${this._scale})`,
            transformOrigin: '0 0',
          })}
          @click=${this._handleClick}
          @dblclick=${this._handleDoubleClick}
        >
          <div class="affine-embed-linked-doc-content">
            <div class="affine-embed-linked-doc-content-title">
              <div class="affine-embed-linked-doc-content-title-icon">
                ${icon}
              </div>

              <div class="affine-embed-linked-doc-content-title-text">
                ${title}
              </div>
            </div>

            ${when(
              hasDescriptionAlias,
              () =>
                html`<div class="affine-embed-linked-doc-content-note alias">
                  ${description}
                </div>`,
              () =>
                when(
                  showDefaultNoteContent,
                  () => html`
                    <div class="affine-embed-linked-doc-content-note default">
                      ${defaultNoteContent}
                    </div>
                  `,
                  () => html`
                    <div
                      class="affine-embed-linked-doc-content-note render"
                    ></div>
                  `
                )
            )}
            ${isError
              ? html`
                  <div class="affine-embed-linked-doc-card-content-reload">
                    <div
                      class="affine-embed-linked-doc-card-content-reload-button"
                      @click=${this.refreshData}
                    >
                      ${ReloadIcon} <span>Reload</span>
                    </div>
                  </div>
                `
              : html`
                  <div class="affine-embed-linked-doc-content-date">
                    <span>Updated</span>

                    <span>${dateText}</span>
                  </div>
                `}
          </div>

          ${showDefaultBanner
            ? html`
                <div class="affine-embed-linked-doc-banner default">
                  ${defaultBanner}
                </div>
              `
            : nothing}
        </div>
      `
    );
  }

  override updated() {
    // update card style when linked doc deleted
    const linkedDoc = this.linkedDoc;
    const { xywh, style } = this.model;
    const bound = Bound.deserialize(xywh);
    if (linkedDoc && style === 'horizontalThin') {
      bound.w = EMBED_CARD_WIDTH.horizontal;
      bound.h = EMBED_CARD_HEIGHT.horizontal;
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          xywh: bound.serialize(),
          style: 'horizontal',
        });
      });
    } else if (!linkedDoc && style === 'horizontal') {
      bound.w = EMBED_CARD_WIDTH.horizontalThin;
      bound.h = EMBED_CARD_HEIGHT.horizontalThin;
      this.doc.withoutTransact(() => {
        this.doc.updateBlock(this.model, {
          xywh: bound.serialize(),
          style: 'horizontalThin',
        });
      });
    }
  }

  @state()
  private accessor _docUpdatedAt: Date = new Date();

  @state()
  private accessor _linkedDocMode: DocMode = 'page';

  @state()
  private accessor _loading = false;

  // reference to block/element
  @state()
  private accessor _referenceToNode = false;

  @property({ attribute: false })
  accessor isBannerEmpty = false;

  @property({ attribute: false })
  accessor isError = false;

  @property({ attribute: false })
  accessor isNoteContentEmpty = false;

  @queryAsync('.affine-embed-linked-doc-content-note.render')
  accessor noteContainer!: Promise<HTMLDivElement | null>;
}
