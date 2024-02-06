import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing } from 'lit';
import {
  customElement,
  property,
  query,
  queryAsync,
  state,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import type { PageBlockComponent, PageService } from '../page-block/index.js';
import { Bound } from '../surface-block/index.js';
import type { SurfaceRefBlockService } from '../surface-ref-block/index.js';
import type { SurfaceRefRenderer } from '../surface-ref-block/surface-ref-renderer.js';
import {
  SYNCED_BLOCK_DEFAULT_HEIGHT,
  SYNCED_BLOCK_DEFAULT_WIDTH,
} from '../synced-block/styles.js';
import type {
  EmbedLinkedDocModel,
  EmbedLinkedDocStyles,
} from './embed-linked-doc-model.js';
import type { EmbedLinkedDocService } from './embed-linked-doc-service.js';
import { styles } from './styles.js';
import { getEmbedLinkedDocIcons, renderDocInCard } from './utils.js';

@customElement('affine-embed-linked-doc-block')
export class EmbedLinkedDocBlockComponent extends EmbedBlockElement<
  EmbedLinkedDocModel,
  EmbedLinkedDocService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedLinkedDocStyles)[number] = 'horizontal';
  override _width = EMBED_CARD_WIDTH.horizontal;
  override _height = EMBED_CARD_HEIGHT.horizontal;

  @property({ attribute: false })
  abstractText = '';

  @property({ attribute: false })
  isBannerEmpty = false;

  @property({ attribute: false })
  surfaceRefService!: SurfaceRefBlockService;

  @property({ attribute: false })
  surfaceRefRenderer?: SurfaceRefRenderer;

  @state()
  private _pageMode: 'page' | 'edgeless' = 'page';

  @state()
  private _pageUpdatedAt: Date = new Date();

  @state()
  private _loading = false;

  @state()
  private _error = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  @queryAsync('.affine-embed-linked-doc-banner.render')
  bannerContainer!: Promise<HTMLDivElement>;

  get pageMode() {
    return this._pageMode;
  }

  get doc() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return page;
  }

  get pageTitle() {
    return this.doc?.meta.title.length ? this.doc.meta.title : 'Untitled';
  }

  private get _pageService() {
    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService, `Page service not found.`);
    return pageService;
  }

  private async _load() {
    this._loading = true;
    this._error = false;
    this.abstractText = '';
    this.isBannerEmpty = true;

    const linkedDoc = this.doc;
    if (!linkedDoc) {
      this._loading = false;
      return;
    }

    this._pageMode = this._pageService.getPageMode(this.model.pageId);
    this._pageUpdatedAt = this._pageService.getPageUpdatedAt(this.model.pageId);

    if (!linkedDoc.loaded) {
      await new Promise<void>(resolve => {
        linkedDoc
          .load()
          .then(() => resolve())
          .catch(e => {
            console.error(e);
            this._error = true;
            resolve();
          });
      });
    }

    if (!this._error && !linkedDoc.root) {
      await new Promise<void>(resolve => {
        linkedDoc.slots.rootAdded.once(() => {
          resolve();
        });
      });
    }

    this._loading = false;

    if (!this._error) {
      renderDocInCard(this, linkedDoc);
    }
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
      path: this.path,
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
    if (linkedDocId === this.model.page.id) return;

    const pageElement = this.std.view.viewFromPath('block', [
      this.model.page.root?.id ?? '',
    ]) as PageBlockComponent | null;
    assertExists(pageElement);

    pageElement.slots.pageLinkClicked.emit({ pageId: linkedDocId });
  };

  covertToInline = () => {
    const { page, pageId } = this.model;
    const parent = page.getParent(this.model);
    assertExists(parent);
    const index = parent.children.indexOf(this.model);

    const yText = new Workspace.Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: { type: 'LinkedPage', pageId },
    });
    const text = new page.Text(yText);

    page.addBlock(
      'affine:paragraph',
      {
        text,
      },
      parent,
      index
    );

    page.deleteBlock(this.model);
  };

  convertToEmbed = () => {
    const { page, pageId, caption, xywh } = this.model;

    if (this.isInSurface) {
      const bound = Bound.deserialize(xywh);
      bound.w = SYNCED_BLOCK_DEFAULT_WIDTH;
      bound.h = SYNCED_BLOCK_DEFAULT_HEIGHT;

      const edgeless = this.edgeless;
      assertExists(edgeless);
      const blockId = edgeless.service.addBlock(
        'affine:synced',
        { pageId, xywh: bound.serialize(), caption },
        edgeless.surface.model
      );
      edgeless.service.selection.set({
        editing: false,
        elements: [blockId],
      });
    } else {
      const parent = page.getParent(this.model);
      assertExists(parent);
      const index = parent.children.indexOf(this.model);

      page.addBlock('affine:synced', { pageId, caption }, parent, index);

      this.std.selection.setGroup('note', []);
    }
    page.deleteBlock(this.model);
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });
  };

  cleanUpSurfaceRefRenderer = () => {
    if (this.surfaceRefRenderer) {
      this.surfaceRefService.removeRenderer(this.surfaceRefRenderer.id);
    }
  };

  override updated() {
    // update card style when linked page deleted
    const linkedDoc = this.doc;
    const { xywh, style } = this.model;
    const bound = Bound.deserialize(xywh);
    if (linkedDoc && style === 'horizontalThin') {
      bound.w = EMBED_CARD_WIDTH.horizontal;
      bound.h = EMBED_CARD_HEIGHT.horizontal;
      this.page.withoutTransact(() => {
        this.page.updateBlock(this.model, {
          xywh: bound.serialize(),
          style: 'horizontal',
        });
      });
    } else if (!linkedDoc && style === 'horizontal') {
      bound.w = EMBED_CARD_WIDTH.horizontalThin;
      bound.h = EMBED_CARD_HEIGHT.horizontalThin;
      this.page.withoutTransact(() => {
        this.page.updateBlock(this.model, {
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
      this._error = true;
    });

    const linkedDoc = this.doc;
    if (linkedDoc) {
      this.disposables.add(
        linkedDoc.workspace.meta.pageMetasUpdated.on(() => this._load())
      );
      this.disposables.add(linkedDoc.slots.blockUpdated.on(() => this._load()));
    }

    this.model.propsUpdated.on(({ key }) => {
      if (key === 'pageId') {
        this._load().catch(e => {
          console.error(e);
          this._error = true;
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
    super.disconnectedCallback();
    this.cleanUpSurfaceRefRenderer();
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    const selection = this.host.selection;
    const textSelection = selection.find('text');
    if (
      !!textSelection &&
      (!!textSelection.to || !!textSelection.from.length)
    ) {
      return null;
    }

    const blockSelections = selection.filter('block');
    if (
      blockSelections.length > 1 ||
      (blockSelections.length === 1 && blockSelections[0].path !== this.path)
    ) {
      return null;
    }

    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .block=${this}
          .abortController=${abortController}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this,
        placement: 'top-start',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override renderBlock() {
    const linkedDoc = this.doc;
    const isDeleted = !linkedDoc;
    const isLoading = this._loading;
    const pageMode = this.pageMode;

    this._cardStyle = this.model.style;
    this._width = EMBED_CARD_WIDTH[this._cardStyle];
    this._height = EMBED_CARD_HEIGHT[this._cardStyle];

    const isEmpty = this._isPageEmpty() && this.isBannerEmpty;

    const cardClassMap = classMap({
      loading: isLoading,
      deleted: isDeleted,
      empty: isEmpty,
      'banner-empty': this.isBannerEmpty,
      [this._cardStyle]: true,
    });

    const {
      LoadingIcon,
      LinkedDocIcon,
      LinkedDocDeletedIcon,
      LinkedDocDeletedBanner,
      LinkedDocEmptyBanner,
    } = getEmbedLinkedDocIcons(pageMode, this._cardStyle);

    const titleIcon = isLoading
      ? LoadingIcon
      : isDeleted
        ? LinkedDocDeletedIcon
        : LinkedDocIcon;

    const titleText = isLoading
      ? 'Loading...'
      : isDeleted
        ? `Deleted ${pageMode}`
        : linkedDoc?.meta.title.length
          ? linkedDoc.meta.title
          : 'Untitled';

    const descriptionText = isLoading
      ? ''
      : isDeleted
        ? 'This linked page is deleted.'
        : isEmpty
          ? 'Preview of the page will be displayed here.'
          : this.abstractText;

    const dateText = this._pageUpdatedAt.toLocaleTimeString();

    const showDefaultBanner = isDeleted || isEmpty;

    const defaultBanner = isDeleted
      ? LinkedDocDeletedBanner
      : LinkedDocEmptyBanner;

    return this.renderEmbed(
      () => html`
        <div
          ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
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

            <div class="affine-embed-linked-doc-content-description">
              ${descriptionText}
            </div>

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
        </div>

        <embed-card-caption .block=${this}></embed-card-caption>

        <affine-block-selection .block=${this}></affine-block-selection>
      `
    );
  }
}
