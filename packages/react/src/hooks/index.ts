import createContext from 'zustand/context';
import create from 'zustand';
import { combine } from 'zustand/middleware';
import { Page, StoreOptions, uuidv4, Workspace } from '@blocksuite/store';

export interface BlockSuiteState {
  workspace: Workspace;
  currentPage: Page | null;
  pages: Page[];
}

export interface BlockSuiteActions {
  setCurrentPage: (page: Page | null) => void;
  createPage: (id?: string) => void;
}

export const createBlockSuiteStore = (option: StoreOptions) => {
  const workspace = new Workspace(option);
  const store = create(
    combine<BlockSuiteState, BlockSuiteActions>(
      {
        workspace,
        pages: [],
        currentPage: null,
      },
      set => ({
        setCurrentPage: page => {
          set({
            currentPage: page,
          });
        },
        createPage: (id = uuidv4()) => {
          workspace.createPage(id);
        },
      })
    )
  );
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
  return store;
};

type CreateBlockSuiteStore = ReturnType<typeof createBlockSuiteStore>;

export const {
  useStore: useBlockSuiteStore,
  useStoreApi: useBlockSuiteStoreApi,
  Provider: BlockSuiteProvider,
} = createContext<CreateBlockSuiteStore>();
