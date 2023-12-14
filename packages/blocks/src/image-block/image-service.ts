import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { isPageMode, matchFlavours } from '../_common/utils/index.js';
import type { DocPageBlockComponent } from '../page-block/doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import type { ImageBlockModel } from './image-model.js';
import { ImageSelection } from './image-selection.js';
import { addSiblingImageBlock } from './utils.js';

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
    flavour: this.flavour,
    onDrop: async ({ files, targetModel, place, point }) => {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (targetModel && !matchFlavours(targetModel, ['affine:surface'])) {
        addSiblingImageBlock(imageFiles, this.maxFileSize, targetModel, place);
      } else if (!isPageMode(this.page)) {
        const edgelessPage = this
          .pageBlockComponent as EdgelessPageBlockComponent;
        await edgelessPage.addImages(imageFiles, point);
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
