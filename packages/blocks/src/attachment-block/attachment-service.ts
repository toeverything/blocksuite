import type { EditorHost } from '@blocksuite/block-std';

import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { Slot } from '@blocksuite/store';
import { render } from 'lit';

import type { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import type { RootBlockComponent } from '../root-block/types.js';
import type { DragHandleOption } from '../root-block/widgets/drag-handle/config.js';
import type { AttachmentBlockComponent } from './attachment-block.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
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
    edgeless: true,
    flavour: AttachmentBlockSchema.model.flavour,
    onDragEnd: props => {
      const { draggingElements, editorHost, state } = props;
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
        target?.classList.contains('edgeless') &&
        target?.classList.contains('affine-block-children-container');

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
            embed: false,
            style,
          });
        }

        return convertDragPreviewDocToEdgeless({
          blockComponent,
          cssSelector: '.affine-attachment-container',
          height: EMBED_CARD_HEIGHT[style],
          width: EMBED_CARD_WIDTH[style],
          ...props,
        });
      }

      return false;
    },
    onDragStart: ({ anchorBlockPath, editorHost, startDragging, state }) => {
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
        const attachmentPortal = blockComponent.closest(
          '.edgeless-block-portal-attachment'
        );
        assertExists(attachmentPortal);
        const dragPreviewEl = attachmentPortal.cloneNode() as HTMLElement;
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
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, place, point, targetModel }) => {
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
          module: 'toolbar',
          page: 'whiteboard editor',
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
