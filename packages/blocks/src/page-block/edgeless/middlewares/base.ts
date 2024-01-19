import type { EdgelessPageService } from '../edgeless-page-service.js';

export type EdgelessMiddleware = (edgeless: EdgelessPageService) => () => void;
