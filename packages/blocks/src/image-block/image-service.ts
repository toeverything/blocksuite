import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import {
  FileDropManager,
  type FileDropRule,
} from '../_common/components/file-drop-manager.js';
import type { Point } from '../_common/utils/index.js';
import { isPageMode } from '../_common/utils/index.js';
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

  fileDropRule: FileDropRule = {
    name: 'Image',
    maxFileSize: this.maxFileSize,
    embed: true,
    matcher: file => file.type.startsWith('image/'),
    handleDropInSurface: async (files: File[], point: Point) => {
      console.log(point);
      if (isPageMode(this.page)) return false;
      const edgelessPage = this
        .pageBlockComponent as EdgelessPageBlockComponent;

      await edgelessPage.addImages(files, point);

      return true;
    },
  };

  fileDropManager!: FileDropManager;

  override mounted(): void {
    super.mounted();
    this.selectionManager.register(ImageSelection);
    this.fileDropManager = new FileDropManager(this, this.fileDropRule);
  }
}
