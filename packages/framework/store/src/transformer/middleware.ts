import type { Slot } from '@blocksuite/global/utils';

import type { Doc, DocCollection } from '../store/index.js';
import type { AssetsManager } from './assets.js';
import type { DraftModel } from './draft.js';
import type { Slice } from './slice.js';
import type {
  BlockSnapshot,
  CollectionInfoSnapshot,
  DocSnapshot,
  SliceSnapshot,
} from './type.js';

export type BeforeImportPayload =
  | {
      index?: number;
      parent?: string;
      snapshot: BlockSnapshot;
      type: 'block';
    }
  | {
      snapshot: CollectionInfoSnapshot;
      type: 'info';
    }
  | {
      snapshot: DocSnapshot;
      type: 'page';
    }
  | {
      snapshot: SliceSnapshot;
      type: 'slice';
    };

export type BeforeExportPayload =
  | {
      model: DraftModel;
      type: 'block';
    }
  | {
      page: Doc;
      type: 'page';
    }
  | {
      slice: Slice;
      type: 'slice';
    }
  | {
      type: 'info';
    };

export type FinalPayload =
  | {
      index?: number;
      model: DraftModel;
      parent?: string;
      snapshot: BlockSnapshot;
      type: 'block';
    }
  | {
      page: Doc;
      snapshot: DocSnapshot;
      type: 'page';
    }
  | {
      slice: Slice;
      snapshot: SliceSnapshot;
      type: 'slice';
    }
  | {
      snapshot: CollectionInfoSnapshot;
      type: 'info';
    };

export type JobSlots = {
  afterExport: Slot<FinalPayload>;
  afterImport: Slot<FinalPayload>;
  beforeExport: Slot<BeforeExportPayload>;
  beforeImport: Slot<BeforeImportPayload>;
};

type JobMiddlewareOptions = {
  adapterConfigs: Map<string, string>;
  assetsManager: AssetsManager;
  collection: DocCollection;
  slots: JobSlots;
};

export type JobMiddleware = (options: JobMiddlewareOptions) => void;
