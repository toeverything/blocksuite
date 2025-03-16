import { StoreExtension } from '@blocksuite/store';

// bytes.parse('2GB')
const maxFileSize = 2 * 1024 * 1024 * 1024;

export class FileSizeLimitService extends StoreExtension {
  static override key = 'file-size-limit';

  maxFileSize = maxFileSize;
}
