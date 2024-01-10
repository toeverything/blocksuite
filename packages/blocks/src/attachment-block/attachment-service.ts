import { BlockService } from '@blocksuite/block-std';
import { Slot } from '@blocksuite/store';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { matchFlavours } from '../_common/utils/model.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { addSiblingAttachmentBlock } from './utils.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  slots = {
    onFilesDropped: new Slot<File[]>(),
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, targetModel, place }) => {
      if (!files.length || !targetModel) return false;
      if (matchFlavours(targetModel, ['affine:surface'])) return false;

      // generic attachment block for all files except images
      const attachmentFiles = files.filter(
        file => !file.type.startsWith('image/')
      );

      attachmentFiles.forEach(file => {
        addSiblingAttachmentBlock(
          file,
          this.maxFileSize,
          targetModel,
          place
        ).catch(console.error);
      });
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
