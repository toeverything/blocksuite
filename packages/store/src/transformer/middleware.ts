import type { Slot } from '@blocksuite/global/utils';

import type { BaseBlockModel } from '../schema/index.js';
import type { Page, Workspace } from '../workspace/index.js';
import type { AssetsManager } from './assets.js';
import type { Slice } from './slice.js';
import type {
  BlockSnapshot,
  PageSnapshot,
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
      snapshot: PageSnapshot;
      type: 'page';
    }
  | {
      snapshot: WorkspaceInfoSnapshot;
      type: 'info';
    };

export type BeforeExportPayload =
  | {
      model: BaseBlockModel;
      type: 'block';
    }
  | {
      page: Page;
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
      model: BaseBlockModel;
      parent?: string;
      index?: number;
    }
  | {
      snapshot: PageSnapshot;
      type: 'page';
      page: Page;
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
  workspace: Workspace;
  assetsManager: AssetsManager;
  slots: JobSlots;
  adapterConfigs: Map<string, string>;
};

export type JobMiddleware = (options: JobMiddlewareOptions) => void;
