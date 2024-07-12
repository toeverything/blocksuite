import type { DocCollection } from '@blocksuite/store';

export interface InitFn {
  (collection: DocCollection, docId: string): Promise<void> | void;
  description: string;
  displayName: string;
  id: string;
}
