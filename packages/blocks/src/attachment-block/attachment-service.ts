import { BlockService } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import {
  FileDropManager,
  type FileDropRule,
} from '../_common/components/file-drop-manager.js';
import type { AttachmentBlockModel } from './attachment-model.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)

  override mounted(): void {
    super.mounted();
    this.initFileDrop();
  }

  initFileDrop() {
    const root = this.std.root as BlockSuiteRoot;

    const fileDropRule: FileDropRule = {
      name: 'File',
      maxFileSize: this.maxFileSize,
      embed: false,
      matcher: (file: File) => !file.type.startsWith('image/'), // generic attachment block for all files except images
    };

    const fileDropManager = new FileDropManager(root, fileDropRule);

    this.disposables.addFromEvent(root, 'dragover', fileDropManager.onDragOver);
    this.disposables.addFromEvent(root, 'drop', fileDropManager.onDrop);
  }
}
