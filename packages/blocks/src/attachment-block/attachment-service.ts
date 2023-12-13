import { BlockService } from '@blocksuite/block-std';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { toast } from '../_common/components/toast.js';
import { humanFileSize } from '../_common/utils/math.js';
import { matchFlavours } from '../_common/utils/model.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { addSiblingAttachmentBlock } from './utils.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    maxFileSize: this.maxFileSize,
    onDrop: async ({ files, targetModel, place }) => {
      if (!files.length || !targetModel) return false;
      if (matchFlavours(targetModel, ['affine:surface'])) return false;

      // generic attachment block for all files except images
      const attachmentFiles = files.filter(
        file => !file.type.startsWith('image/')
      );

      const isSizeExceeded = attachmentFiles.some(
        file => file.size > this.maxFileSize
      );
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

      attachmentFiles.forEach(file =>
        addSiblingAttachmentBlock(file, targetModel, this.maxFileSize, place)
      );
      return true;
    },
  };

  fileDropManager!: FileDropManager;

  override mounted(): void {
    super.mounted();
    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}
