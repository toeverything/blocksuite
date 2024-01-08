import './components/bookmark-card.js';
import '../_common/components/button.js';
import './doc-bookmark-block.js';
import './edgeless-bookmark-block.js';

import { assertExists, Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { html, render } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { LinkCardCaption } from '../_common/components/link-card/link-card-caption.js';
import { LINK_CARD_HEIGHT, LINK_CARD_WIDTH } from '../_common/consts.js';
import { matchFlavours } from '../_common/utils/index.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import { AffineDragHandleWidget } from '../page-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../page-block/widgets/drag-handle/utils.js';
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

  @state()
  showCaption = false;

  @query('affine-edgeless-bookmark, affine-doc-bookmark')
  edgelessOrDocBookmark?:
    | EdgelessBookmarkBlockComponent
    | DocBookmarkBlockComponent;

  @query('link-card-caption')
  captionElement!: LinkCardCaption;

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
      const isInSurface = blockComponent.isInSurface;
      if (!isInSurface) {
        this.host.selection.setGroup('note', [
          this.host.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      }

      const element = captureEventTarget(state.raw.target);
      const insideDragHandle = !!element?.closest('affine-drag-handle-widget');
      if (!insideDragHandle) return false;

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
            this.page.updateBlock(blockComponent.model, {
              style: 'horizontal',
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
          width: LINK_CARD_WIDTH[style],
          height: LINK_CARD_HEIGHT[style],
          ...props,
        });
      }

      return false;
    },
  };

  refreshUrlData = () => {
    refreshBookmarkUrlData(this).catch(console.error);
  };

  override connectedCallback() {
    super.connectedCallback();

    if (!!this.model.caption && this.model.caption.length > 0) {
      this.showCaption = true;
    }

    const parent = this.host.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';

    if (!this.model.description && !this.model.title) {
      this.refreshUrlData();
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.edgelessOrDocBookmark?.requestUpdate();
        if (key === 'url') {
          this.refreshUrlData();
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

  override render() {
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
