import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';

import { assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { html, nothing } from 'lit';
import {
  customElement,
  property,
  query,
  queryAsync,
  state,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { renderLinkedDocInCard } from '../_common/utils/render-linked-doc.js';
import type { RootBlockComponent } from '../root-block/index.js';
import { Bound } from '../surface-block/index.js';
import type { SurfaceRefBlockService } from '../surface-ref-block/index.js';
import type { SurfaceRefRenderer } from '../surface-ref-block/surface-ref-renderer.js';
import type {
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';
import type { EmbedLinkedDocBlockService } from './embed-linked-doc-service.js';
import { styles } from './styles.js';
import { getEmbedLinkedDocIcons } from './utils.js';

@customElement('affine-embed-linked-doc-block')
export class EmbedLinkedDocBlockComponent extends EmbedBlockElement<
  EmbedLinkedDocModel,
  EmbedLinkedDocBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedLinkedDocStyles)[number] = 'horizontal';
  override _width = EMBED_CARD_WIDTH.horizontal;
  override _height = EMBED_CARD_HEIGHT.horizontal;

  @property({ attribute: false })
  isNoteContentEmpty = false;

  @property({ attribute: false })
  isBannerEmpty = false;

  @property({ attribute: false })
  surfaceRefService!: SurfaceRefBlockService;

  @property({ attribute: false })
  isError = false;

  @property({ attribute: false })
  surfaceRefRenderer?: SurfaceRefRenderer;

  @state()
  private _editorMode: 'page' | 'edgeless' = 'page';

  @state()
  private _docUpdatedAt: Date = new Date();

  @state()
  private _loading = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  @queryAsync('.affine-embed-linked-doc-banner.render')
  bannerContainer!: Promise<HTMLDivElement>;

  @queryAsync('.affine-embed-linked-doc-content-note.render')
  noteContainer!: Promise<HTMLDivElement>;

  get editorMode() {
    return this._editorMode;
  }

  get linkedDoc() {
    const doc = this.std.collection.getDoc(this.model.pageId);
    return doc;
  }

  get docTitle() {
    return this.linkedDoc?.meta?.title.length
      ? this.linkedDoc.meta.title
      : 'Untitled';
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private async _load() {
    this._loading = true;
    this.isError = false;
    this.isNoteContentEmpty = true;
    this.isBannerEmpty = true;

    const linkedDoc = this.linkedDoc;
    if (!linkedDoc) {
      this._loading = false;
      return;
    }

    this._editorMode = this._rootService.getEditorMode(this.model.pageId);
    this._docUpdatedAt = this._rootService.getDocUpdatedAt(this.model.pageId);

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

    if (!this.isError) {
      // renderLinkedDocInCard(this);
      const cardStyle = this.model.style;
      if (cardStyle === 'horizontal' || cardStyle === 'vertical') {
        renderLinkedDocInCard(this);
      }
    }
  }

  private _isDocEmpty() {
    const linkedDoc = this.linkedDoc;
    if (!linkedDoc) {
      return false;
    }
    return (
      !!linkedDoc &&
      !linkedDoc.meta?.title.length &&
      this.isNoteContentEmpty &&
      this.isBannerEmpty
    );
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.isInSurface) return;
    this._selectBlock();
  }

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    this.open();
  }

  open = () => {
    const linkedDocId = this.model.pageId;
    if (linkedDocId === this.doc.id) return;

    const rootElement = this.std.view.viewFromPath('block', [
      this.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootElement);

    rootElement.slots.docLinkClicked.emit({ docId: linkedDocId });
  };

  covertToInline = () => {
    const { doc, pageId } = this.model;
    const parent = doc.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    const yText = new DocCollection.Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: { type: 'LinkedPage', pageId },
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

  convertToEmbed = () => {
    const { doc, pageId, caption, xywh } = this.model;

    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );
    if (!isSyncedDocEnabled) {
      return;
    }

    if (this.isInSurface) {
      const style = 'syncedDoc';
      const bound = Bound.deserialize(xywh);
      bound.w = EMBED_CARD_WIDTH[style];
      bound.h = EMBED_CARD_HEIGHT[style];

      const edgeless = this.edgeless;
      assertExists(edgeless);
      const blockId = edgeless.service.addBlock(
        'affine:embed-synced-doc',
        { pageId, xywh: bound.serialize(), caption },
        edgeless.surface.model
      );
      edgeless.service.selection.set({
        editing: false,
        elements: [blockId],
      });
    } else {
      const parent = doc.getParent(this.model);
      assertExists(parent);
      const index = parent.children.indexOf(this.model);

      doc.addBlock(
        'affine:embed-synced-doc',
        { pageId, caption },
        parent,
        index
      );

      this.std.selection.setGroup('note', []);
    }
    doc.deleteBlock(this.model);
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this.isError = true;
    });
  };

  cleanUpSurfaceRefRenderer = () => {
    if (this.surfaceRefRenderer) {
      this.surfaceRefService.removeRenderer(this.surfaceRefRenderer.id);
    }
  };

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

  override connectedCallback() {
    super.connectedCallback();
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
            ['xywh', 'caption', ''].includes(payload.props.key)
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
    }

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId' || key === 'style') {
        this._load().catch(e => {
          console.error(e);
          this.isError = true;
        });
      }
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);

      this.disposables.add(
        this.model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );
    }
  }

  override disconnectedCallback() {
    this.cleanUpSurfaceRefRenderer();
    super.disconnectedCallback();
  }

  override renderBlock() {
    this._cardStyle = this.model.style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const linkedDoc = this.linkedDoc;
    const isDeleted = !linkedDoc;
    const isLoading = this._loading;
    const isError = this.isError;
    const editorMode = this.editorMode;
    const isEmpty = this._isDocEmpty() && this.isBannerEmpty;

    const cardClassMap = classMap({
      loading: isLoading,
      error: isError,
      deleted: isDeleted,
      empty: isEmpty,
      'banner-empty': this.isBannerEmpty,
      'note-empty': this.isNoteContentEmpty,
      [this._cardStyle]: true,
    });

    const {
      LoadingIcon,
      LinkedDocIcon,
      LinkedDocDeletedIcon,
      LinkedDocDeletedBanner,
      LinkedDocEmptyBanner,
    } = getEmbedLinkedDocIcons(editorMode, this._cardStyle);

    const titleIcon = isLoading
      ? LoadingIcon
      : isDeleted
        ? LinkedDocDeletedIcon
        : LinkedDocIcon;

    const titleText = isLoading
      ? 'Loading...'
      : isDeleted
        ? `Deleted ${this.editorMode}`
        : linkedDoc?.meta?.title.length
          ? linkedDoc.meta.title
          : 'Untitled';

    const showDefaultNoteContent = isLoading || isDeleted || isEmpty;
    const defaultNoteContent = isLoading
      ? ''
      : isDeleted
        ? 'This linked doc is deleted.'
        : isEmpty
          ? 'Preview of the doc will be displayed here.'
          : '';

    const dateText = this._docUpdatedAt.toLocaleTimeString();

    const showDefaultBanner = isDeleted || isEmpty;

    const defaultBanner = isLoading
      ? LinkedDocEmptyBanner
      : isDeleted
        ? LinkedDocDeletedBanner
        : LinkedDocEmptyBanner;

    return this.renderEmbed(
      () => html`
        <div>
          <div
            class="affine-embed-linked-doc-block ${cardClassMap}"
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-linked-doc-content">
              <div class="affine-embed-linked-doc-content-title">
                <div class="affine-embed-linked-doc-content-title-icon">
                  ${titleIcon}
                </div>

                <div class="affine-embed-linked-doc-content-title-text">
                  ${titleText}
                </div>
              </div>

              <div class="affine-embed-linked-doc-content-note render"></div>
              ${showDefaultNoteContent
                ? html`<div
                    class="affine-embed-linked-doc-content-note default"
                  >
                    ${defaultNoteContent}
                  </div>`
                : nothing}

              <div class="affine-embed-linked-doc-content-date">
                <span>Updated</span>

                <span>${dateText}</span>
              </div>
            </div>

            <div class="affine-embed-linked-doc-banner render"></div>

            ${showDefaultBanner
              ? html`
                  <div class="affine-embed-linked-doc-banner default">
                    ${defaultBanner}
                  </div>
                `
              : nothing}
            <div class="affine-embed-linked-doc-block-overlay"></div>
          </div>

          <embed-card-caption .block=${this}></embed-card-caption>

          <affine-block-selection .block=${this}></affine-block-selection>
        </div>

        ${this.isInSurface ? nothing : Object.values(this.widgets)}
      `
    );
  }
}
