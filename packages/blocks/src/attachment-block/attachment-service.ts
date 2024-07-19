import type { EditorHost } from '@blocksuite/block-std';

import { BlockService, Bound } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';
import { render } from 'lit';

import type { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { EdgelessRootService } from '../root-block/edgeless/edgeless-root-service.js';
import type { RootBlockComponent } from '../root-block/types.js';
import type { DragHandleOption } from '../root-block/widgets/drag-handle/config.js';
import type { AttachmentBlockComponent } from './attachment-block.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { Point } from '../_common/utils/index.js';
import { matchFlavours } from '../_common/utils/model.js';
import { isInsideEdgelessEditor } from '../_common/utils/query.js';
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
  type AttachmentBlockModel,
  AttachmentBlockSchema,
} from './attachment-model.js';
import { addSiblingAttachmentBlocks } from './utils.js';

export class AttachmentBlockService extends BlockService<AttachmentBlockModel> {
  private _dragHandleOption: DragHandleOption = {
    flavour: AttachmentBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath, editorHost }) => {
      if (!anchorBlockPath) return false;
      const anchorComponent = editorHost.std.view.getBlock(anchorBlockPath);
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [
          AttachmentBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = anchorComponent as AttachmentBlockComponent;
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
      const { state, draggingElements, editorHost } = props;
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          AttachmentBlockSchema.model.flavour,
        ])
      )
        return false;

      const blockComponent = draggingElements[0] as AttachmentBlockComponent;
      const isInSurface = blockComponent.isInSurface;
      const target = captureEventTarget(state.raw.target);
      const isTargetEdgelessContainer =
        target?.classList.contains('edgeless-container');

      if (isInSurface) {
        const style = blockComponent.model.style;
        const targetStyle = style === 'cubeThick' ? 'horizontalThin' : style;
        return convertDragPreviewEdgelessToDoc({
          blockComponent,
          style: targetStyle,
          ...props,
        });
      } else if (isTargetEdgelessContainer) {
        let style = blockComponent.model.style ?? 'cubeThick';
        const embed = blockComponent.model.embed;
        if (embed) {
          style = 'cubeThick';
          editorHost.doc.updateBlock(blockComponent.model, {
            style,
            embed: false,
          });
        }

        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.affine-attachment-container',
          width: EMBED_CARD_WIDTH[style],
          height: EMBED_CARD_HEIGHT[style],
          ...props,
        });
      }

      return false;
    },
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, targetModel, place, point }) => {
      if (!files.length) return false;

      // generic attachment block for all files except images
      const attachmentFiles = files.filter(
        file => !file.type.startsWith('image/')
      );

      if (targetModel && !matchFlavours(targetModel, ['affine:surface'])) {
        await addSiblingAttachmentBlocks(
          this.host as EditorHost,
          attachmentFiles,
          this.maxFileSize,
          targetModel,
          place
        );
      } else if (isInsideEdgelessEditor(this.host as EditorHost)) {
        const edgelessRoot = this.rootElement as EdgelessRootBlockComponent;
        point = edgelessRoot.service.viewport.toViewCoordFromClientCoord(point);
        await edgelessRoot.addAttachments(attachmentFiles, point);

        edgelessRoot.service.telemetryService?.track('CanvasElementAdded', {
          control: 'canvas:drop',
          page: 'whiteboard editor',
          module: 'toolbar',
          segment: 'toolbar',
          type: 'attachment',
        });
      }

      this.slots.onFilesDropped.emit(attachmentFiles);
      return true;
    },
  };

  fileDropManager!: FileDropManager;

  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  slots = {
    onFilesDropped: new Slot<File[]>(),
  };

  override mounted(): void {
    super.mounted();

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  get rootElement(): RootBlockComponent {
    const rootModel = this.doc.root;
    assertExists(rootModel);

    const rootElement = this.std.view.viewFromPath('block', [
      rootModel.id,
    ]) as RootBlockComponent | null;
    assertExists(rootElement);
    return rootElement;
  }
}
