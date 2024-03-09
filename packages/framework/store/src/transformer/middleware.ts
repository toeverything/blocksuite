import type { Slot } from '@blocksuite/global/utils';

import type { BlockModel } from '../schema/index.js';
import type { Doc, DocCollection } from '../store/index.js';
import type { AssetsManager } from './assets.js';
import type { Slice } from './slice.js';
import type {
  BlockSnapshot,
  DocSnapshot,
  SliceSnapshot,
  WorkspaceInfoSnapshot,
} from './type.js';

export type BeforeImportPayload =
  | {
      snapshot: BlockSnapshot;
      type: 'block';
      parent?: string;
      index?: number;
    }
  | {
      snapshot: SliceSnapshot;
      type: 'slice';
    }
  | {
      snapshot: DocSnapshot;
      type: 'page';
    }
  | {
      snapshot: WorkspaceInfoSnapshot;
      type: 'info';
    };

export type BeforeExportPayload =
  | {
      model: BlockModel;
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
      snapshot: BlockSnapshot;
      type: 'block';
      model: BlockModel;
      parent?: string;
      index?: number;
    }
  | {
      snapshot: DocSnapshot;
      type: 'page';
      page: Doc;
    }
  | {
      snapshot: SliceSnapshot;
      type: 'slice';
      slice: Slice;
    }
  | {
      snapshot: WorkspaceInfoSnapshot;
      type: 'info';
    };

export type JobSlots = {
  beforeImport: Slot<BeforeImportPayload>;
  afterImport: Slot<FinalPayload>;
  beforeExport: Slot<BeforeExportPayload>;
  afterExport: Slot<FinalPayload>;
};

type JobMiddlewareOptions = {
  workspace: DocCollection;
  assetsManager: AssetsManager;
  slots: JobSlots;
  adapterConfigs: Map<string, string>;
};

export type JobMiddleware = (options: JobMiddlewareOptions) => void;
