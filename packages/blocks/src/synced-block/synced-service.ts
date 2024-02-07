import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { render } from 'lit';

import { matchFlavours } from '../_common/utils/model.js';
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
import {
  SYNCED_BLOCK_DEFAULT_HEIGHT,
  SYNCED_BLOCK_DEFAULT_WIDTH,
} from './styles.js';
import type { SyncedBlockComponent } from './synced-block.js';
import { type SyncedBlockModel, SyncedBlockSchema } from './synced-model.js';

export class SyncedService extends BlockService<SyncedBlockModel> {
  private _dragHandleOption: DragHandleOption = {
    flavour: SyncedBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      if (!anchorBlockPath) return false;

      const element = captureEventTarget(state.raw.target);
      const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
      if (!insideDragHandle) {
        return false;
      }

      const anchorComponent = editorHost.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [SyncedBlockSchema.model.flavour])
      )
        return false;

      const blockComponent = anchorComponent as SyncedBlockComponent;

      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface) {
        editorHost.selection.setGroup('note', [
          editorHost.selection.create('block', {
            path: blockComponent.path,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface) {
        const syncedPortal = blockComponent.closest(
          '.edgeless-block-portal-synced'
        );
        assertExists(syncedPortal);
        const dragPreviewEl = syncedPortal.cloneNode() as HTMLElement;
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
      const { state, draggingElements } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          SyncedBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as SyncedBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

      if (isInSurface) {
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.affine-synced-container',
          width: SYNCED_BLOCK_DEFAULT_WIDTH,
          height: SYNCED_BLOCK_DEFAULT_HEIGHT,
          ...props,
        });
      }

      return false;
    },
  };

  override mounted(): void {
    super.mounted();

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }
}
