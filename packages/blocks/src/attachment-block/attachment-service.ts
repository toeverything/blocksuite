import { AttachmentBlockSchema } from '@blocksuite/affine-model';
import {
  DragHandleConfigExtension,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
  isInsideEdgelessEditor,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import type { RootBlockComponent } from '../root-block/types.js';
import type { AttachmentBlockComponent } from './attachment-block.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { EMBED_CARD_HEIGHT, EMBED_CARD_WIDTH } from '../_common/consts.js';
import { EdgelessRootBlockComponent } from '../root-block/edgeless/edgeless-root-block.js';
import { AttachmentEdgelessBlockComponent } from './attachment-edgeless-block.js';
import { addSiblingAttachmentBlocks } from './utils.js';

export class AttachmentBlockService extends BlockService {
  static override readonly flavour = AttachmentBlockSchema.model.flavour;

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
          this.host,
          attachmentFiles,
          this.maxFileSize,
          targetModel,
          place
        );
      } else if (isInsideEdgelessEditor(this.host)) {
        const edgelessRoot = this.rootComponent;
        if (!(edgelessRoot instanceof EdgelessRootBlockComponent)) return false;
        point = edgelessRoot.service.viewport.toViewCoordFromClientCoord(point);
        await edgelessRoot.addAttachments(attachmentFiles, point);

        this.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
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

  get rootComponent(): RootBlockComponent | null {
    const rootModel = this.doc.root;
    if (!rootModel) return null;
    const rootComponent = this.std.view.getBlock(
      rootModel.id
    ) as RootBlockComponent | null;
    return rootComponent;
  }

  override mounted(): void {
    super.mounted();

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}

export const AttachmentDragHandleOption = DragHandleConfigExtension({
  flavour: AttachmentBlockSchema.model.flavour,
  edgeless: true,
  onDragEnd: props => {
    const { state, draggingElements, editorHost } = props;
    if (
      draggingElements.length !== 1 ||
      !matchFlavours(draggingElements[0].model, [
        AttachmentBlockSchema.model.flavour,
      ])
    )
      return false;

    const blockComponent = draggingElements[0] as
      | AttachmentBlockComponent
      | AttachmentEdgelessBlockComponent;
    const isInSurface =
      blockComponent instanceof AttachmentEdgelessBlockComponent;
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
});
