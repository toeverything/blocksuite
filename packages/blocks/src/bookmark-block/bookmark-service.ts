import { BlockService, Bound } from '@blocksuite/block-std';
import { render } from 'lit';

import type { EdgelessRootService } from '../root-block/edgeless/edgeless-root-service.js';
import type { DragHandleOption } from '../root-block/widgets/drag-handle/config.js';
import type { BookmarkBlockComponent } from './bookmark-block.js';

import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import { Point } from '../_common/utils/index.js';
import { matchFlavours } from '../_common/utils/model.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../root-block/widgets/drag-handle/utils.js';
import {
  type BookmarkBlockModel,
  BookmarkBlockSchema,
} from './bookmark-model.js';

export class BookmarkBlockService extends BlockService<BookmarkBlockModel> {
  private _dragHandleOption: DragHandleOption = {
    flavour: BookmarkBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = editorHost.std.view.getBlock(anchorBlockPath);
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
        editorHost.selection.setGroup('note', [
          editorHost.selection.create('block', {
            blockId: blockComponent.blockId,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const edgelessService = editorHost.std.spec.getService(
          'affine:page'
        ) as EdgelessRootService;
        const zoom = edgelessService?.viewport.zoom ?? 1;
        const dragPreviewEl = document.createElement('div');
        const bound = Bound.deserialize(blockComponent.model.xywh);
        const offset = new Point(bound.x * zoom, bound.y * zoom);
        render(
          blockComponent.host.renderModel(blockComponent.model),
          dragPreviewEl
        );

        startDragging([blockComponent], state, dragPreviewEl, offset);
        return true;
      }
      return false;
    },
    onDragEnd: props => {
      const { state, draggingElements } = props;
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
        target?.classList.contains('edgeless-container');

      if (isInSurface) {
        const style = blockComponent.model.style;
        const targetStyle =
          style === 'vertical' || style === 'cube' ? 'horizontal' : style;
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          style: targetStyle,
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

  private static readonly linkPreviewer = new LinkPreviewer();

  static setLinkPreviewEndpoint =
    BookmarkBlockService.linkPreviewer.setEndpoint;

  queryUrlData = (url: string, signal?: AbortSignal) => {
    return BookmarkBlockService.linkPreviewer.query(url, signal);
  };

  override mounted(): void {
    super.mounted();

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }
}
