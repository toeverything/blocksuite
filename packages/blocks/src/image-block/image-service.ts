import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { toast } from '../_common/components/toast.js';
import { isPageMode, matchFlavours } from '../_common/utils/index.js';
import { humanFileSize } from '../_common/utils/math.js';
import type { DocPageBlockComponent } from '../page-block/doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import type { ImageBlockModel } from './image-model.js';
import { ImageSelection } from './image-selection.js';

export class ImageService extends BlockService<ImageBlockModel> {
  get pageBlockComponent(): DocPageBlockComponent | EdgelessPageBlockComponent {
    const pageBlock = this.page.root;
    assertExists(pageBlock);

    const pageElement = this.std.view.viewFromPath('block', [pageBlock.id]) as
      | DocPageBlockComponent
      | EdgelessPageBlockComponent
      | null;
    assertExists(pageElement);
    return pageElement;
  }

  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  private _fileDropOptions: FileDropOptions = {
    flavour: 'Image',
    maxFileSize: this.maxFileSize,
    matcher: file => file.type.startsWith('image/'),
    onDrop: async ({ files, targetModel, place, point }) => {
      const isSizeExceeded = files.some(file => file.size > this.maxFileSize);
      if (isSizeExceeded) {
        toast(
          `You can only upload files less than ${humanFileSize(
            this.maxFileSize,
            true,
            0
          )}`
        );
        return true;
      }

      if (targetModel && !matchFlavours(targetModel, ['affine:surface'])) {
        place;
        // implement drop in note
      } else if (!isPageMode(this.page)) {
        const edgelessPage = this
          .pageBlockComponent as EdgelessPageBlockComponent;
        await edgelessPage.addImages(files, point);
      }

      return true;
    },
  };

  fileDropManager!: FileDropManager;

  override mounted(): void {
    super.mounted();
    this.selectionManager.register(ImageSelection);
    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}
