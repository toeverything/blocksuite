import type { BlockService } from '../extension/index.js';

export abstract class BlockServiceWatcher {
  constructor(readonly blockService: BlockService) {}

  abstract setup(): void;
}
