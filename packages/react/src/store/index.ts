import createContext from 'zustand/context';
import create from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';
import type { Workspace } from '@blocksuite/store';
import type { ManagerActions, ManagerState } from './manager/index.js';
import { createManagerActions, createManagerState } from './manager/index.js';
import type {
  CurrentWorkspaceActions,
  CurrentWorkspaceState,
} from './currentWorkspace/index.js';
import {
  createCurrentWorkspaceActions,
  createCurrentWorkspaceState,
  currentWorkspaceSideEffect,
} from './currentWorkspace/index.js';

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

  currentWorkspaceSideEffect(store);

  return store;
};

export type CreateBlockSuiteStore = ReturnType<typeof createBlockSuiteStore>;

export const {
  useStore: useBlockSuiteStore,
  useStoreApi: useBlockSuiteStoreApi,
  Provider: BlockSuiteProvider,
} = createContext<CreateBlockSuiteStore>();
