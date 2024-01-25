import './components/bookmark-card.js';
import '../_common/components/block-selection.js';
import '../_common/components/embed-card/embed-card-caption.js';
import '../_common/components/embed-card/embed-card-toolbar.js';

import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { flip, offset } from '@floating-ui/dom';
import { html, nothing, render } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
import { HoverController } from '../_common/components/hover/controller.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { matchFlavours } from '../_common/utils/index.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../page-block/widgets/drag-handle/utils.js';
import { Bound } from '../surface-block/utils/bound.js';
import {
  type BookmarkBlockModel,
  BookmarkBlockSchema,
} from './bookmark-model.js';
import type { BookmarkService } from './bookmark-service.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<
  BookmarkBlockModel,
  BookmarkService
> {
  @property({ attribute: false })
  loading = false;

  @property({ attribute: false })
  loadingFailed = false;

  @property({ attribute: false })
  showCaption = false;

  @query('bookmark-card')
  bookmarkCard!: HTMLElement;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  get edgeless() {
    if (this._isInSurface) return null;
    return this.host.querySelector('affine-edgeless-page');
  }

  private _dragHandleOption: DragHandleOption = {
    flavour: BookmarkBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          BookmarkBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = anchorComponent as BookmarkBlockComponent;
      const element = captureEventTarget(state.raw.target);

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        this.host.selection.setGroup('note', [
          this.host.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const bookmarkPortal = blockComponent.closest(
          '.edgeless-block-portal-bookmark'
        );
        assertExists(bookmarkPortal);
        const dragPreviewEl = bookmarkPortal.cloneNode() as HTMLElement;
        dragPreviewEl.style.transform = '';
        dragPreviewEl.style.left = '0';
        dragPreviewEl.style.top = '0';
        render(
          blockComponent.host.renderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements, dropBlockId } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          BookmarkBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as BookmarkBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

      if (isInSurface) {
        if (dropBlockId) {
          const style = blockComponent.model.style;
          if (style === 'vertical' || style === 'cube') {
            const { xywh } = blockComponent.model;
            const bound = Bound.deserialize(xywh);
            bound.w = EMBED_CARD_WIDTH.horizontal;
            bound.h = EMBED_CARD_HEIGHT.horizontal;
            this.page.updateBlock(blockComponent.model, {
              style: 'horizontal',
              xywh: bound.serialize(),
            });
          }
        }

        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        const style = blockComponent.model.style;

        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: 'bookmark-card',
          width: EMBED_CARD_WIDTH[style],
          height: EMBED_CARD_HEIGHT[style],
          ...props,
        });
      }

      return false;
    },
  };

  open = () => {
    let link = this.model.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshBookmarkUrlData(this).catch(console.error);
  };

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    if (!!this.model.caption && this.model.caption.length > 0) {
      this.showCaption = true;
    }

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!this.model.description && !this.model.title) {
      this.refreshData();
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        if (key === 'url') {
          this.refreshData();
        }
      })
    );

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
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
          .model=${this.model}
          .block=${this}
          .host=${this.host}
          .abortController=${abortController}
          .std=${this.std}
        ></embed-card-toolbar>
      `,
      computePosition: {
        referenceElement: this.bookmarkCard,
        placement: 'top-end',
        middleware: [flip(), offset(4)],
        autoUpdate: true,
      },
    };
  });

  override renderBlock() {
    const { caption, style } = this.model;

    let containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
      margin: '18px 0px',
    });
    if (this.isInSurface) {
      const width = EMBED_CARD_WIDTH[style];
      const height = EMBED_CARD_HEIGHT[style];
      const bound = Bound.deserialize(
        (this.edgeless?.service.getElementById(this.model.id) ?? this.model)
          .xywh
      );
      const scaleX = bound.w / width;
      const scaleY = bound.h / height;
      containerStyleMap = styleMap({
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: '0 0',
      });
    }

    return html`<div
      ${this.isInSurface ? null : ref(this._whenHover.setReference)}
      class="affine-bookmark-container"
      style=${containerStyleMap}
    >
      <bookmark-card
        .bookmark=${this}
        .loading=${this.loading}
        .loadingFailed=${this.loadingFailed}
      ></bookmark-card>

      <embed-card-caption
        .block=${this}
        .display=${this.showCaption}
        @blur=${() => {
          if (!caption) this.showCaption = false;
        }}
      ></embed-card-caption>

      ${this.selected?.is('block')
        ? html`<affine-block-selection></affine-block-selection>`
        : nothing}
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
