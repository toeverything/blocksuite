import type { EdgelessRootService } from '../edgeless-root-service.js';

export type EdgelessMiddleware = (edgeless: EdgelessRootService) => () => void;
