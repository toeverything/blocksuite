import type { BlobEngine } from '@blocksuite/sync';
import type { Subject } from 'rxjs';
import type { Awareness } from 'y-protocols/awareness.js';
import type * as Y from 'yjs';

import type { IdGenerator } from '../utils/id-generator.js';
import type { CreateBlocksOptions, Doc, GetBlocksOptions } from './doc.js';
import type { Store } from './store/store.js';
import type { WorkspaceMeta } from './workspace-meta.js';

export interface Workspace {
  readonly id: string;
  readonly meta: WorkspaceMeta;
  readonly idGenerator: IdGenerator;
  readonly blobSync: BlobEngine;
  readonly onLoadDoc?: (doc: Y.Doc) => void;
  readonly onLoadAwareness?: (awareness: Awareness) => void;

  get doc(): Y.Doc;
  get docs(): Map<string, Doc>;

  slots: {
    docListUpdated: Subject<void>;
    docCreated: Subject<string>;
    docRemoved: Subject<string>;
  };

  createDoc(options?: CreateBlocksOptions): Store;
  getDoc(docId: string, options?: GetBlocksOptions): Store | null;
  removeDoc(docId: string): void;

  dispose(): void;
}
