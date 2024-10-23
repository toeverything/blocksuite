import { ImageBlockSchema } from '@blocksuite/affine-model';
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
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';

import type { ImageBlockComponent } from './image-block.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { setImageProxyMiddlewareURL } from '../_common/transformers/middlewares.js';
import { addImages } from '../root-block/edgeless/utils/common.js';
import { ImageEdgelessBlockComponent } from './image-edgeless-block.js';
import { addSiblingImageBlock } from './utils.js';

export class ImageBlockService extends BlockService {
  static override readonly flavour = ImageBlockSchema.model.flavour;

  static setImageProxyURL = setImageProxyMiddlewareURL;

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
        const gfx = this.std.get(GfxControllerIdentifier);
        point = gfx.viewport.toViewCoordFromClientCoord(point);
        await addImages(this.std, files, point);

        this.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
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

  fileDropManager!: FileDropManager;

  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  override mounted(): void {
    super.mounted();

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}

export const ImageDragHandleOption = DragHandleConfigExtension({
  flavour: ImageBlockSchema.model.flavour,
  edgeless: true,
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
    const isInSurface = blockComponent instanceof ImageEdgelessBlockComponent;
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
});
