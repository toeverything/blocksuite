import type { StateCreator } from 'zustand/vanilla';
import type { BlockSuiteState } from '../store/index.js';

export type BlockSuiteActionsCreator<
  Actions,
  Store = BlockSuiteState
> = StateCreator<
  Store,
  [['zustand/subscribeWithSelector', never]],
  [],
  Actions
>;
