import {
  type ImageBlockModel,
  ImageBlockSchema,
} from '@blocksuite/affine-model';
import { ImageSelection } from '@blocksuite/affine-shared/selection';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';
import { Bound, Point } from '@blocksuite/global/utils';
import { render } from 'lit';

import type { EdgelessRootService } from '../root-block/edgeless/edgeless-root-service.js';
import type { RootBlockComponent } from '../root-block/types.js';
import type { DragHandleOption } from '../root-block/widgets/drag-handle/config.js';
import type { ImageBlockComponent } from './image-block.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { setImageProxyMiddlewareURL } from '../_common/transformers/middlewares.js';
import { isInsideEdgelessEditor } from '../_common/utils/query.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../root-block/widgets/drag-handle/drag-handle.js';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '../root-block/widgets/drag-handle/utils.js';
import { addSiblingImageBlock } from './utils.js';

export class ImageBlockService extends BlockService<ImageBlockModel> {
  private _dragHandleOption: DragHandleOption = {
    flavour: ImageBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      const element = captureEventTarget(state.raw.target);
      if (element?.classList.contains('resize')) return false;

      if (!anchorBlockPath) return false;
      const anchorComponent = editorHost.std.view.getBlock(anchorBlockPath);
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [ImageBlockSchema.model.flavour])
      )
        return false;

      const blockComponent = anchorComponent as ImageBlockComponent;

      const isDraggingByDragHandle = !!element?.closest(
        AFFINE_DRAG_HANDLE_WIDGET
      );
      const isDraggingByComponent = blockComponent.contains(element);
      const isInSurface = blockComponent.isInSurface;

      if (!isInSurface && (isDraggingByDragHandle || isDraggingByComponent)) {
        editorHost.std.selection.setGroup('note', [
          editorHost.std.selection.create('block', {
            blockId: blockComponent.blockId,
          }),
        ]);
        startDragging([blockComponent], state);
        return true;
      } else if (isInSurface && isDraggingByDragHandle) {
        const edgelessService = editorHost.std.spec.getService(
          'affine:page'
        ) as EdgelessRootService;
        const scale = edgelessService.viewport.zoom || 1;
        const width = blockComponent.getBoundingClientRect().width;
        const bound = Bound.deserialize(blockComponent.model.xywh);
        const zoom = edgelessService.viewport.zoom || 1;
        const offset = new Point(bound.x * zoom, bound.y * zoom);

        const dragPreviewEl = document.createElement('div');
        dragPreviewEl.style.borderRadius = '4px';
        dragPreviewEl.style.overflow = 'hidden';
        dragPreviewEl.style.width = `${width / scale}px`;
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
          ImageBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as ImageBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless-container');

      if (isInSurface) {
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.drag-target',
          ...props,
        });
      }
      return false;
    },
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, targetModel, place, point }) => {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (!imageFiles.length) return false;

      if (targetModel && !matchFlavours(targetModel, ['affine:surface'])) {
        addSiblingImageBlock(
          this.host,
          imageFiles,
          this.maxFileSize,
          targetModel,
          place
        );
      } else if (isInsideEdgelessEditor(this.host)) {
        const edgelessRoot = this.rootComponent;
        if (!(edgelessRoot instanceof EdgelessRootBlockComponent)) return false;
        point = edgelessRoot.service.viewport.toViewCoordFromClientCoord(point);
        await edgelessRoot.addImages(imageFiles, point);

        edgelessRoot.service.telemetryService?.track('CanvasElementAdded', {
          control: 'canvas:drop',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'image',
        });
      }

      return true;
    },
  };

  static setImageProxyURL = setImageProxyMiddlewareURL;

  fileDropManager!: FileDropManager;

  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  override mounted(): void {
    super.mounted();

    this.selectionManager.register(ImageSelection);

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  get rootComponent(): RootBlockComponent | null {
    const rootModel = this.doc.root;
    if (!rootModel) return null;
    const rootComponent = this.std.view.viewFromPath('block', [
      rootModel.id,
    ]) as RootBlockComponent | null;
    return rootComponent;
  }
}
