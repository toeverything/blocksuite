import '../_common/components/block-selection';
import '../_common/components/embed-card/embed-card-toolbar';
import '../_common/components/embed-card/embed-card-caption';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, Workspace } from '@blocksuite/store';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing, render, type TemplateResult } from 'lit';
import { customElement, query, queryAsync, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import { REFERENCE_NODE } from '../_common/inline/presets/nodes/consts.js';
import { matchFlavours } from '../_common/utils/index.js';
import type { ImageBlockModel } from '../image-block/index.js';
import type { NoteBlockModel, PageBlockComponent } from '../index.js';
import {
  Bound,
  deserializeXYWH,
  getCommonBound,
} from '../surface-block/index.js';
import type {
  SurfaceRefBlockModel,
  SurfaceRefBlockService,
} from '../surface-ref-block/index.js';
import type { SurfaceRefRenderer } from '../surface-ref-block/surface-ref-renderer.js';
import type {
  EmbedLinkedPageModel,
  EmbedLinkedPageStyles,
} from './embed-linked-page-model.js';
import type { EmbedLinkedPageService } from './embed-linked-page-service.js';
import { styles } from './styles.js';
import { getEmbedLinkedPageIcons } from './utils.js';

@customElement('affine-embed-linked-page-block')
export class EmbedLinkedPageBlockComponent extends EmbedBlockElement<
  EmbedLinkedPageModel,
  EmbedLinkedPageService
> {
  static override styles = styles;

  override cardStyle: (typeof EmbedLinkedPageStyles)[number] = 'horizontal';
  override _width = EMBED_CARD_WIDTH.horizontal;
  override _height = EMBED_CARD_HEIGHT.horizontal;

  @state()
  private _loading = false;

  @state()
  private _isBannerEmpty = false;

  @state()
  showCaption = false;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  @queryAsync('.affine-embed-linked-page-banner.render')
  private _bannerContainer!: Promise<HTMLDivElement>;

  private _pageMode: 'page' | 'edgeless' = 'page';

  private _abstractText = '';

  private _pageUpdatedAt: Date = new Date();

  private _surfaceRefService!: SurfaceRefBlockService;

  private _surfaceRefRenderer!: SurfaceRefRenderer;

  private get _linkedPage() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return page;
  }

  private get _service() {
    const service = super.service;
    assertExists(service, `Linked page block must run with its service.`);
    return service;
  }

  private _load() {
    const onLoad = () => {
      this._loading = false;
      this._abstractText = this._getAbstractText();
      this._prepareSurfaceRefRenderer();
    };

    const { pageId } = this.model;
    this._pageMode = this._service.getPageMode(pageId);
    this._pageUpdatedAt = this._service.getPageUpdatedAt(pageId);

    if (!this._linkedPage) {
      return;
    }

    this._loading = true;
    this._isBannerEmpty = true;

    if (this._linkedPage.loaded) {
      onLoad();
    } else {
      this._linkedPage
        .load()
        .then(() => onLoad())
        .catch(e => {
          console.error(
            `An error occurred while loading page: ${this.model.pageId}`
          );
          console.error(e);
        });
    }
  }

  private _isPageEmpty() {
    const linkedPage = this._linkedPage;
    if (!linkedPage) {
      return false;
    }
    return (
      !!linkedPage &&
      !linkedPage.meta.title.length &&
      !this._abstractText.length
    );
  }

  private _getNoteFromPage() {
    const linkedPage = this._linkedPage;
    assertExists(
      linkedPage,
      `Trying to load page ${this.model.pageId} in linked page block, but the page is not found.`
    );

    const note = linkedPage.root?.children.find(child =>
      matchFlavours(child, ['affine:note'])
    ) as NoteBlockModel | undefined;
    assertExists(
      note,
      `Trying to get note block in page ${this.model.pageId}, but note not found.`
    );

    return note;
  }

  private _prepareSurfaceRefRenderer() {
    const service = this.std.spec.getService(
      'affine:surface-ref'
    ) as SurfaceRefBlockService;
    assertExists(service, `Surface ref service not found.`);
    this._surfaceRefService = service;

    this._cleanUpSurfaceRefRenderer();

    const linkedPage = this._linkedPage;
    assertExists(
      linkedPage,
      `Trying to load page ${this.model.pageId} in linked page block, but the page is not found.`
    );

    this._surfaceRefRenderer = this._surfaceRefService.getRenderer(
      PathFinder.id(this.path),
      linkedPage
    );
    this._surfaceRefRenderer.slots.mounted.on(async () => {
      if (this._pageMode === 'edgeless') {
        await this._renderEdgelessAbstract();
      } else {
        await this._renderPageAbstract();
      }
    });
    this._surfaceRefRenderer.mount();
  }

  private _cleanUpSurfaceRefRenderer() {
    if (this._surfaceRefRenderer) {
      this._surfaceRefService.removeRenderer(this._surfaceRefRenderer.id);
    }
  }

  private _getAbstractText() {
    const note = this._getNoteFromPage();
    const blockHasText = note.children.find(child => child.text != null);
    if (!blockHasText) return '';
    return blockHasText.text!.toString();
  }

  private async _addCover(cover: HTMLElement | TemplateResult<1>) {
    const coverContainer = await this._bannerContainer;
    if (!coverContainer) return;
    while (coverContainer.firstChild) {
      coverContainer.removeChild(coverContainer.firstChild);
    }

    if (cover instanceof HTMLElement) {
      coverContainer.appendChild(cover);
    } else {
      render(cover, coverContainer);
    }
  }

  private async _renderEdgelessAbstract() {
    const renderer = this._surfaceRefRenderer.surfaceRenderer;
    const container = document.createElement('div');
    await this._addCover(container);
    renderer.attach(container);

    // TODO: we may also need to get bounds of surface block's children
    const bounds = Array.from(this._surfaceRefRenderer.elements.values()).map(
      element => Bound.deserialize(element.xywh)
    );
    const bound = getCommonBound(bounds);
    if (bound) {
      renderer.onResize();
      renderer.setViewportByBound(bound);
    } else {
      this._isBannerEmpty = true;
    }
  }

  private async _renderPageAbstract() {
    const note = this._getNoteFromPage();
    const target = note.children.find(child =>
      matchFlavours(child, ['affine:image', 'affine:surface-ref'])
    );

    switch (target?.flavour) {
      case 'affine:image':
        await this._renderImageAbstract(target);
        return;
      case 'affine:surface-ref':
        await this._renderSurfaceRefAbstract(target);
        return;
    }

    this._isBannerEmpty = true;
  }

  private async _renderImageAbstract(image: BlockModel) {
    const sourceId = (image as ImageBlockModel).sourceId;
    if (!sourceId) return;

    const storage = this.model.page.blob;
    const blob = await storage.get(sourceId);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const $img = document.createElement('img');
    $img.src = url;
    await this._addCover($img);

    this._isBannerEmpty = false;
  }

  private async _renderSurfaceRefAbstract(surfaceRef: BlockModel) {
    const referenceId = (surfaceRef as SurfaceRefBlockModel).reference;
    if (!referenceId) return;

    const referencedModel = this._surfaceRefRenderer.getModel(referenceId);
    if (!referencedModel) return;

    const renderer = this._surfaceRefRenderer.surfaceRenderer;
    const container = document.createElement('div');
    await this._addCover(container);

    renderer.attach(container);
    renderer.onResize();
    const bound = Bound.fromXYWH(deserializeXYWH(referencedModel.xywh));
    renderer.setViewportByBound(bound);

    this._isBannerEmpty = false;
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create('block', {
      path: this.path,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  open = () => {
    const linkedPageId = this.model.pageId;
    if (linkedPageId === this.model.page.id) return;

    const pageElement = this.std.view.viewFromPath('block', [
      this.model.page.root?.id ?? '',
    ]) as PageBlockComponent | null;
    assertExists(pageElement);

    pageElement.slots.pageLinkClicked.emit({ pageId: linkedPageId });
  };

  covertToinline = () => {
    const { page, pageId } = this.model;
    const parent = page.getParent(this.model);
    const index = parent?.children.indexOf(this.model);

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

  refreshData = () => {
    this._load();
  };

  private _handleClick() {
    if (this.isInSurface) return;
    this._selectBlock();
  }

  private _handleDoubleClick(event: MouseEvent) {
    if (this.isInSurface) return;
    event.stopPropagation();
    this.open();
  }

  override updated() {
    if (this.isInSurface) {
      // deleted state in horizontal style has 78px height
      const linkedPage = this._linkedPage;
      const { xywh, style } = this.model;
      const bound = Bound.deserialize(xywh);
      if (
        linkedPage &&
        style === 'horizontal' &&
        bound.h !== EMBED_CARD_HEIGHT.horizontal
      ) {
        bound.h = EMBED_CARD_HEIGHT.horizontal;
        this.page.withoutTransact(() => {
          this.page.updateBlock(this.model, {
            xywh: bound.serialize(),
          });
        });
      } else if (!linkedPage && style === 'horizontal' && bound.h !== 78) {
        bound.h = 78;
        this.page.withoutTransact(() => {
          this.page.updateBlock(this.model, {
            xywh: bound.serialize(),
          });
        });
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!!this.model.caption && !!this.model.caption.length) {
      this.showCaption = true;
    }

    this._load();

    this.model.propsUpdated.on(({ key }) => {
      this.requestUpdate();
      if (key === 'pageId') {
        this._load();
      }
    });

    if (this.isInSurface) {
      const surface = this.surface;
      assertExists(surface);
      this.disposables.add(
        surface.edgeless.slots.elementUpdated.on(({ id }) => {
          if (id === this.model.id) {
            this.requestUpdate();
          }
        })
      );
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanUpSurfaceRefRenderer();
  }

  private _whenHover = new HoverController(this, ({ abortController }) => {
    return {
      template: html`
        <style>
          :host {
            z-index: 1;
          }
        </style>
        <embed-card-toolbar
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override render() {
    const linkedPage = this._linkedPage;
    const isDeleted = !linkedPage;
    const isLoading = this._loading;
    const pageMode = this._pageMode;

    this.cardStyle = this.model.style;
    this._width = EMBED_CARD_WIDTH[this.cardStyle];
    this._height =
      isDeleted && this.cardStyle === 'horizontal'
        ? 78
        : EMBED_CARD_HEIGHT[this.cardStyle];

    const isEmpty = this._isPageEmpty() && this._isBannerEmpty;

    const cardClassMap = classMap({
      loading: isLoading,
      deleted: isDeleted,
      empty: isEmpty,
      [this.cardStyle]: true,
    });

    const {
      LoadingIcon,
      LinkedPageIcon,
      LinkedPageDeletedIcon,
      LinkedPageDeletedBanner,
      LinkedPageEmptyBanner,
    } = getEmbedLinkedPageIcons(this._pageMode, this.cardStyle);

    const titleIcon = isLoading
      ? LoadingIcon
      : isDeleted
        ? LinkedPageDeletedIcon
        : LinkedPageIcon;

    const titleText = isLoading
      ? 'Loading...'
      : isDeleted
        ? `Deleted ${pageMode}`
        : linkedPage?.meta.title.length
          ? linkedPage.meta.title
          : 'Untitled';

    const descriptionText = isLoading
      ? ''
      : isDeleted
        ? 'This linked page is deleted.'
        : isEmpty
          ? 'Preview of the page will be displayed here.'
          : this._abstractText;

    const dateText = this._pageUpdatedAt.toLocaleTimeString();

    return this.renderEmbed(
      () => html`
        <div
          style=${styleMap({
            position: 'relative',
          })}
        >
          <div
            ${this.isInSurface ? nothing : ref(this._whenHover.setReference)}
            class="affine-embed-linked-page-block${cardClassMap}"
            @click=${this._handleClick}
            @dblclick=${this._handleDoubleClick}
          >
            <div class="affine-embed-linked-page-content">
              <div class="affine-embed-linked-page-content-title">
                <div class="affine-embed-linked-page-content-title-icon">
                  ${titleIcon}
                </div>

                <div class="affine-embed-linked-page-content-title-text">
                  ${titleText}
                </div>
              </div>

              <div class="affine-embed-linked-page-content-description">
                ${descriptionText}
              </div>

              <div class="affine-embed-linked-page-content-date">
                <span>Updated</span>

                <span>${dateText}</span>
              </div>
            </div>

            <div class="affine-embed-linked-page-banner render"></div>

            <div class="affine-embed-linked-page-banner default">
              ${isDeleted
                ? LinkedPageDeletedBanner
                : isEmpty
                  ? LinkedPageEmptyBanner
                  : nothing}
            </div>
          </div>

          <embed-card-caption
            .block=${this}
            .display=${this.showCaption}
            @blur=${() => {
              if (!this.model.caption) this.showCaption = false;
            }}
          ></embed-card-caption>

          ${this.selected?.is('block')
            ? html`<affine-block-selection></affine-block-selection>`
            : nothing}
        </div>
      `
    );
  }
}
