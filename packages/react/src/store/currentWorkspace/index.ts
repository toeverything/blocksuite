import type { Disposable, Page, Workspace } from '@blocksuite/store';
import { uuidv4 } from '@blocksuite/store';

import type { BlockSuiteActionsCreator } from '../../types/index.js';
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

export const createCurrentWorkspaceActions: BlockSuiteActionsCreator<
  CurrentWorkspaceActions
> = (set, get, store) => {
  return {
    setCurrentWorkspace: (workspace: Workspace) => {
      if (get().workspaces.some(ws => ws === workspace)) {
        const pages = workspacePages.get(workspace);
        set({
          currentWorkspace: workspace,
          currentPage: null,
          pages: pages ? [...pages] : [],
        });
      }
    },
    setCurrentPage: page => {
      set({
        currentPage: page,
      });
    },
    createPage: (id = uuidv4()) => {
      get().currentWorkspace.createPage(id);
    },
    deletePage: id => {
      get().currentWorkspace.removePage(id);
    },
  };
};

export const currentWorkspaceSideEffect = (
  workspace: Workspace,
  store: CreateBlockSuiteStore
) => {
  const dispose: Disposable[] = [
    workspace.slots.pageAdded.on(id => {
      store.setState(state => {
        return {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          pages: [...state.pages, workspace.getPage(id)!],
        };
      });
    }),
    workspace.slots.pageRemoved.on(id => {
      store.setState(state => {
        const index = state.pages.findIndex(page => page.id === id);
        state.pages.splice(index, 1);
        if (state.currentPage?.id === id) {
          return {
            pages: [...state.pages],
            currentPage: null,
          };
        } else {
          return {
            pages: [...state.pages],
          };
        }
      });
    }),
  ];
  store.subscribe(
    store => store.currentWorkspace,
    (workspace, prev) => {
      if (prev !== workspace) {
        dispose.forEach(d => d.dispose());
      }
      const disposeAdded = workspace.slots.pageAdded.on(id => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const page = workspace.getPage(id)!;
        store.setState(state => {
          return {
            pages: [...state.pages, page],
          };
        });
      });
      const disposeRemoved = workspace.slots.pageRemoved.on(id => {
        store.setState(state => {
          const index = state.pages.findIndex(page => page.id === id);
          state.pages.splice(index, 1);
          if (state.currentPage?.id === id) {
            return {
              pages: [...state.pages],
              currentPage: null,
            };
          } else {
            return {
              pages: [...state.pages],
            };
          }
        });
      });
      dispose.push(disposeAdded, disposeRemoved);
    }
  );
};
