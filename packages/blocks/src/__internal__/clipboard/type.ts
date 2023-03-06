import type { Page } from '@blocksuite/store';

export interface Clipboard {
  initEvent(page: Page): void;
  disposeEvent(): void;
}
