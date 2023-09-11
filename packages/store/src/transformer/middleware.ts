import type { Slot } from '@blocksuite/global/utils';

import type { BaseBlockModel } from '../schema/index.js';
import type { Page, Workspace } from '../workspace/index.js';
import type { AssetsManager } from './assets.js';
import type {
  BlockSnapshot,
  PageSnapshot,
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
