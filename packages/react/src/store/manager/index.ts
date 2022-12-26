import type { Workspace } from '@blocksuite/store';
import type { BlockSuiteActionsCreator } from '../../types/index.js';
import type { Page } from '@blocksuite/store';

export interface ManagerState {
  workspaces: Workspace[];
}

export const workspacePages = new WeakMap<Workspace, Page[]>();

function bindWorkspaceWithPages(workspace: Workspace) {
  if (workspacePages.has(workspace)) {
    console.error('should bind once!!!');
    return;
  }
  workspace.signals.pageAdded.on(id => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const page = workspace.getPage(id)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (workspacePages.has(workspace)) {
      const oldPages = workspacePages.get(workspace)!;
      workspacePages.set(workspace, [...oldPages, page]);
    } else {
      workspacePages.set(workspace, [page]);
    }
  });
  workspace.signals.pageRemoved.on(id => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (workspacePages.has(workspace)) {
      const oldPages = workspacePages.get(workspace)!;
      const index = oldPages.findIndex(page => page.id === id);
      oldPages.splice(index, 1);
      workspacePages.set(workspace, [...oldPages]);
    } else {
      console.error('not possible');
    }
  });
}

export const createManagerState = (
  defaultWorkspace: Workspace
): ManagerState => {
  bindWorkspaceWithPages(defaultWorkspace);
  return {
    workspaces: [defaultWorkspace],
  };
};

export interface ManagerActions {
  addWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (workspace: Workspace) => void;
}

export const createManagerActions: BlockSuiteActionsCreator<
  ManagerActions
> = set => ({
  addWorkspace: (workspace: Workspace) => {
    bindWorkspaceWithPages(workspace);
    set(state => ({
      workspaces: [...state.workspaces, workspace],
    }));
  },
  deleteWorkspace: (workspace: Workspace) => {
    set(state => {
      const index = state.workspaces.findIndex(ws => ws === workspace);
      state.workspaces.splice(index, 1);
      return {
        workspaces: [...state.workspaces],
      };
    });
  },
});
