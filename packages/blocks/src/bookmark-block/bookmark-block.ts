import './components/bookmark-card.js';
import '../_common/components/button.js';
import './doc-bookmark-block.js';
import './edgeless-bookmark-block.js';

import { assertExists, Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { html, render } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { EmbedCardCaption } from '../_common/components/embed-card/embed-card-caption.js';
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
import type { DocBookmarkBlockComponent } from './doc-bookmark-block.js';
import type { EdgelessBookmarkBlockComponent } from './edgeless-bookmark-block.js';
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

  @state()
  showCaption = false;

  @query('affine-edgeless-bookmark, affine-doc-bookmark')
  edgelessOrDocBookmark?:
    | EdgelessBookmarkBlockComponent
    | DocBookmarkBlockComponent;

  @query('embed-card-caption')
  captionElement!: EmbedCardCaption;

  private _isInSurface = false;

  get isInSurface() {
    return this._isInSurface;
  }

  readonly slots = {
    loadingUpdated: new Slot(),
  };

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
          cssSelector: '.affine-bookmark-card',
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
        this.edgelessOrDocBookmark?.requestUpdate();
        if (key === 'url') {
          this.refreshData();
        }
      })
    );

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('loading')) {
      this.slots.loadingUpdated.emit();
    }
  }

  override renderBlock() {
    return html`${this.isInSurface
      ? html`<affine-edgeless-bookmark
          .block=${this}
        ></affine-edgeless-bookmark>`
      : html`<affine-doc-bookmark .block=${this}></affine-doc-bookmark>`} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
