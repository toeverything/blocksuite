import type { Workspace } from '@blocksuite/store';
import type { BlockSuiteActionsCreator } from '../../types/index.js';

export interface ManagerState {
  workspaces: Workspace[];
}

export const createManagerState = (
  defaultWorkspace: Workspace
): ManagerState => ({
  workspaces: [],
});

export interface ManagerActions {
  addWorkspace: () => void;
}

export const createManagerActions: BlockSuiteActionsCreator<
  ManagerActions
> = () => ({
  addWorkspace: () => {
    // do nothing for now
  },
});
