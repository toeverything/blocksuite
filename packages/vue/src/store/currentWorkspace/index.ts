import type { Disposable, Page, Workspace } from '@blocksuite/store';
import { uuidv4 } from '@blocksuite/store';
import { watch } from 'vue';

import type { CreateBlockSuiteStore } from '../index.js';
import { workspacePages } from '../manager/index.js';

export interface CurrentWorkspaceState {
  currentWorkspace: Workspace;
  currentPage: Page | null;
  pages: Page[];
}

export const createCurrentWorkspaceState = (
  defaultWorkspace: Workspace
): CurrentWorkspaceState => ({
  currentWorkspace: defaultWorkspace,
  pages: [],
  currentPage: null,
});

export interface CurrentWorkspaceActions {
  setCurrentWorkspace: (workspace: Workspace) => void;
  setCurrentPage: (page: Page | null) => void;
  createPage: (id?: string) => void;
  deletePage: (id: string) => void;
}

export const createCurrentWorkspaceActions = (
  store: CreateBlockSuiteStore
): CurrentWorkspaceActions => {
  return {
    setCurrentWorkspace: (workspace: Workspace) => {
      if (store.workspaces.some(ws => ws === workspace)) {
        const pages = workspacePages.get(workspace);
        Object.assign(store, {
          currentWorkspace: workspace,
          currentPage: null,
          pages: pages ? [...pages] : [],
        });
      }
    },
    setCurrentPage: page => {
      store.currentPage = page;
    },
    createPage: (id = uuidv4()) => {
      store.currentWorkspace.createPage(id);
    },
    deletePage: id => {
      store.currentWorkspace.removePage(id);
    },
  };
};

export const currentWorkspaceSideEffect = (
  workspace: Workspace,
  store: CreateBlockSuiteStore
) => {
  const dispose: Disposable[] = [
    workspace.signals.pageAdded.on(id => {
      store.pages.push(workspace.getPage(id)!);
    }),
    workspace.signals.pageRemoved.on(id => {
      const index = store.pages.findIndex(page => page.id === id);
      store.pages.splice(index, 1);
      if (store.currentPage?.id === id) {
        store.currentPage = null;
        store.pages = [...store.pages];
      } else {
        store.pages = [...store.pages];
      }
    }),
  ];

  watch(
    () => store.currentWorkspace,
    (workspace, prev) => {
      if (prev !== workspace) {
        dispose.forEach(d => d.dispose());
      }
      const disposeAdded = workspace.signals.pageAdded.on(id => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const page = workspace.getPage(id)!;
        store.pages = store.pages.concat(page);
      });
      const disposeRemoved = workspace.signals.pageRemoved.on(id => {
        const index = store.pages.findIndex(page => page.id === id);
        store.pages.splice(index, 1);
        if (store.currentPage?.id === id) {
          Object.assign(store, {
            pages: [...store.pages],
            currentPage: null,
          });
        } else {
          store.pages = [...store.pages];
        }
      });
      dispose.push(disposeAdded, disposeRemoved);
    }
  );
};
