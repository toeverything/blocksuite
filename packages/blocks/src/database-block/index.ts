import type { DatabaseBlockModel } from './database-model.js';
import type { DatabaseService } from './database-service.js';

export { checkboxPureColumnConfig } from './common/columns/checkbox/define.js';
export { datePureColumnConfig } from './common/columns/date/define.js';
export { linkPureColumnConfig } from './common/columns/link/define.js';
export { multiSelectColumnConfig } from './common/columns/multi-select/cell-renderer.js';
export { multiSelectPureColumnConfig } from './common/columns/multi-select/define.js';
export { numberPureColumnConfig } from './common/columns/number/define.js';
export { progressPureColumnConfig } from './common/columns/progress/define.js';
export { richTextPureColumnConfig } from './common/columns/rich-text/define.js';
export * from './database-block.js';
export * from './database-model.js';
export * from './database-service.js';
export * from './types.js';
export { insertPositionToIndex } from './utils/insert.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:database': DatabaseService;
    }
    interface BlockModels {
      'affine:database': DatabaseBlockModel;
    }
  }
}
