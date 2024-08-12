import type { EdgelessRootService } from './edgeless/edgeless-root-service.js';
import type { PageRootService } from './page/page-root-service.js';
import type { RootBlockConfig } from './types.js';

export * from './clipboard/index.js';
export * from './edgeless/index.js';
export * from './page/page-root-block.js';
export { PageRootService } from './page/page-root-service.js';
export * from './preview/preview-root-block.js';
export {
  type QuickSearchService,
  RootService,
  type TelemetryEvent,
  type TelemetryEventMap,
  type TelemetryService,
} from './root-service.js';
export * from './types.js';
export * from './utils/index.js';
export * from './widgets/index.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:page': PageRootService | EdgelessRootService;
    }
    interface BlockConfigs {
      'affine:page': RootBlockConfig;
    }
  }
}
