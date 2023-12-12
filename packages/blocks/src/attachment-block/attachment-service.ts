import { BlockService } from '@blocksuite/block-std';

import {
  FileDropManager,
  type FileDropRule,
} from '../_common/components/file-drop-manager.js';
import type { AttachmentBlockModel } from './attachment-model.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  fileDropRule: FileDropRule = {
    name: 'File',
    maxFileSize: this.maxFileSize,
    embed: false,
    matcher: (file: File) => !file.type.startsWith('image/'), // generic attachment block for all files except images
  };

  fileDropManager!: FileDropManager;

  override mounted(): void {
    super.mounted();

    this.fileDropManager = new FileDropManager(this, this.fileDropRule);

    this.disposables.addFromEvent(
      this.std.host,
      'dragover',
      this.fileDropManager.onDragOver
    );
  }
}
