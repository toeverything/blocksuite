import type { PathMap } from '../../store/index.js';
import { UIEventState } from '../base.js';

type BlockEventStateOptions = {
  event: Event;
  target: PathMap;
};

export class BlockEventState extends UIEventState {
  override type = 'blockState';

  readonly target: PathMap;

  constructor({ event, target }: BlockEventStateOptions) {
    super(event);
    this.target = target;
  }
}

declare global {
  interface BlockSuiteUIEventState {
    blockState: BlockEventState;
  }
}
