import { builtInSchemas } from '@blocksuite/blocks/models';
import type { Page, Workspace } from '@blocksuite/store';

import type { CreateBlockSuiteStore } from '../index.jsx';

export interface ManagerState {
  workspaces: Workspace[];
}

export const workspacePages = new WeakMap<Workspace, Page[]>();

export function bindWorkspaceWithPages(workspace: Workspace) {
  if (workspacePages.has(workspace)) {
    return;
  }
  workspacePages.set(workspace, []);
  workspace.signals.pageAdded.on(id => {
    console.log('add', id);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const page = workspace.getPage(id)!;
    if (workspacePages.has(workspace)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const oldPages = workspacePages.get(workspace)!;
      workspacePages.set(workspace, [...oldPages, page]);
    } else {
      console.error('not possible');
    }
  });
  workspace.signals.pageRemoved.on(id => {
    if (workspacePages.has(workspace)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  defaultWorkspace.register(builtInSchemas);
  return {
    workspaces: [defaultWorkspace],
  };
};

export interface ManagerActions {
  addWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (workspace: Workspace) => void;
}

export const createManagerActions = (
  store: CreateBlockSuiteStore
): ManagerActions => ({
  addWorkspace: (workspace: Workspace) => {
    bindWorkspaceWithPages(workspace);
    workspace.register(builtInSchemas);
    store.workspaces = [...store.workspaces, workspace];
  },
  deleteWorkspace: (workspace: Workspace) => {
    const index = store.workspaces.findIndex(ws => ws === workspace);
    store.workspaces.splice(index, 1);
  },
});
