import createContext from 'zustand/context';
import create from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';
import { Workspace } from '@blocksuite/store';
import type { ManagerActions, ManagerState } from './manager/index.js';
import {
  bindWorkspaceWithPages,
  createManagerActions,
  createManagerState,
} from './manager/index.js';
import type {
  CurrentWorkspaceActions,
  CurrentWorkspaceState,
} from './currentWorkspace/index.js';
import {
  createCurrentWorkspaceActions,
  createCurrentWorkspaceState,
  currentWorkspaceSideEffect,
} from './currentWorkspace/index.js';
import { IndexedDBDocProvider } from '@blocksuite/store';
import { builtInSchemas } from '@blocksuite/blocks/models';

export interface BlockSuiteState extends ManagerState, CurrentWorkspaceState {}

export interface BlockSuiteActions
  extends ManagerActions,
    CurrentWorkspaceActions {}

export const createBlockSuiteStore = (defaultWorkspace: Workspace) => {
  const store = create(
    subscribeWithSelector(
      combine<
        BlockSuiteState,
        BlockSuiteActions,
        [['zustand/subscribeWithSelector', never]]
      >(
        {
          ...createManagerState(defaultWorkspace),
          ...createCurrentWorkspaceState(defaultWorkspace),
        },
        (set, get, store) => ({
          ...createManagerActions(set, get, store),
          ...createCurrentWorkspaceActions(set, get, store),
        })
      )
    )
  );

  if (typeof window !== 'undefined') {
    const str = localStorage.getItem('blocksuite-react') ?? '';
    try {
      const data = JSON.parse(str);
      const workspaces: Workspace[] = data.map(
        (room: string) =>
          new Workspace({
            room,
            providers: [IndexedDBDocProvider],
          })
      );
      workspaces.forEach(workspace => bindWorkspaceWithPages(workspace));
      workspaces.forEach(workspace => workspace.register(builtInSchemas));
      window.setTimeout(
        () =>
          store.setState({
            workspaces,
          }),
        0
      );
    } catch (e) {
      // ignore
    }

    store.subscribe(
      store => store.workspaces,
      workspaces => {
        const rooms = workspaces.map(workspace => workspace.room);
        localStorage.setItem('blocksuite-react', JSON.stringify(rooms));
      }
    );
  }

  currentWorkspaceSideEffect(defaultWorkspace, store);

  return store;
};

export type CreateBlockSuiteStore = ReturnType<typeof createBlockSuiteStore>;

export const {
  useStore: useBlockSuiteStore,
  useStoreApi: useBlockSuiteStoreApi,
  Provider: BlockSuiteProvider,
} = createContext<CreateBlockSuiteStore>();
