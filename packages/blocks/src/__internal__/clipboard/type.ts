import type { Page } from '@blocksuite/store';

export interface Clipboard {
  init(page: Page): void;
  dispose(): void;
}
