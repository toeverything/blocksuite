import type { Page, Workspace } from '@blocksuite/store';
import type { BlockSuiteActionsCreator } from '../../types/index.js';
import { uuidv4 } from '@blocksuite/store';
import type { CreateBlockSuiteStore } from '../index.js';

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
  setCurrentPage: (page: Page | null) => void;
  createPage: (id?: string) => void;
}

export const createCurrentWorkspaceActions: BlockSuiteActionsCreator<
  CurrentWorkspaceActions
> = (set, get, store) => {
  return {
    setCurrentPage: page => {
      set({
        currentPage: page,
      });
    },
    createPage: (id = uuidv4()) => {
      get().currentWorkspace.createPage(id);
    },
  };
};

export const currentWorkspaceSideEffect = (store: CreateBlockSuiteStore) => {
  store.subscribe(
    store => store.currentWorkspace,
    workspace => {
      workspace.signals.pageAdded.on(id => {
        store.setState(state => {
          return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            pages: [...state.pages, workspace.getPage(id)!],
          };
        });
      });
      workspace.signals.pageRemoved.on(id => {
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
    }
  );
};
