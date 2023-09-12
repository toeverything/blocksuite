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
    }
  | {
      snapshot: PageSnapshot;
      type: 'page';
    }
  | {
      snapshot: SliceSnapshot;
      type: 'slice';
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
};

export type JobMiddleware = (options: JobMiddlewareOptions) => void;
