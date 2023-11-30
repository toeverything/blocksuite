import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import {
  FileDropManager,
  type FileDropRule,
} from '../_common/components/file-drop-manager.js';
import type { EdgelessPageBlockComponent, Point } from '../index.js';
// import { buildPath } from '../index.js';
import type { ImageBlockModel } from './image-model.js';
import { ImageSelection } from './image-selection.js';

export class ImageService extends BlockService<ImageBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  override mounted(): void {
    super.mounted();
    this.selectionManager.register(ImageSelection);
    this.initImageFileDrop();
  }

  initImageFileDrop() {
    const root = this.std.root as BlockSuiteRoot;
    assertExists(root);

    const fileDropRule: FileDropRule = {
      name: 'Image',
      maxFileSize: this.maxFileSize,
      embed: true,
      matcher: file => file.type.startsWith('image/'),
      handleDropInEdgeless: async (point: Point, files: File[]) => {
        const pageBlock = root.page.root;
        assertExists(pageBlock);

        const edgelessPageElement = this.std.view.viewFromPath('block', [
          pageBlock.id,
        ]) as EdgelessPageBlockComponent | null;
        assertExists(edgelessPageElement);

        const storage = this.page.blob;
        const fileInfos = await Promise.all(
          files.map(async file => {
            const sourceId = await storage.set(
              new Blob([file], { type: file.type })
            );
            return { file, sourceId };
          })
        );
        edgelessPageElement.addImages(fileInfos, point);
      },
    };

    const fileDropManager = new FileDropManager(root, fileDropRule);
    this.disposables.addFromEvent(root, 'drop', fileDropManager.onDrop);
  }
}
