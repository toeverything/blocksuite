import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { Slot } from '@blocksuite/store';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { matchFlavours } from '../_common/utils/model.js';
import { isInsideEdgelessEditor } from '../_common/utils/query.js';
import type { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import type { PageBlockComponent } from '../page-block/types.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { addSiblingAttachmentBlock } from './utils.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  get pageBlockComponent(): PageBlockComponent {
    const pageBlock = this.page.root;
    assertExists(pageBlock);

    const pageElement = this.std.view.viewFromPath('block', [
      pageBlock.id,
    ]) as PageBlockComponent | null;
    assertExists(pageElement);
    return pageElement;
  }

  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  slots = {
    onFilesDropped: new Slot<File[]>(),
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
        addSiblingAttachmentBlock(
          this.std.host as EditorHost,
          attachmentFiles,
          this.maxFileSize,
          targetModel,
          place
        );
      } else if (isInsideEdgelessEditor(this.std.host as EditorHost)) {
        const edgelessPage = this
          .pageBlockComponent as EdgelessPageBlockComponent;
        await edgelessPage.addFiles(attachmentFiles, point);
      }

      this.slots.onFilesDropped.emit(attachmentFiles);
      return true;
    },
  };

  fileDropManager!: FileDropManager;

  override mounted(): void {
    super.mounted();
    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}
