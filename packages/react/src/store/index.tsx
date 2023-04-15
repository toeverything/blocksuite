import { AffineSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import { DebugDocProvider, Workspace } from '@blocksuite/store';
import { IndexedDBDocProvider } from '@blocksuite/store';
import { createContext, useContext, useMemo, useRef } from 'react';
import { create, useStore } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';

import type {
  CurrentWorkspaceActions,
  CurrentWorkspaceState,
} from './currentWorkspace/index.js';
import {
  createCurrentWorkspaceActions,
  createCurrentWorkspaceState,
  currentWorkspaceSideEffect,
} from './currentWorkspace/index.js';
import type { ManagerActions, ManagerState } from './manager/index.js';
import {
  bindWorkspaceWithPages,
  createManagerActions,
  createManagerState,
} from './manager/index.js';

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
    const str = localStorage.getItem('blocksuite-react') ?? '[]';
    try {
      const data = JSON.parse(str);
      const workspaces: Workspace[] = data.map(
        (id: string) =>
          new Workspace({
            id,
            providers: [DebugDocProvider, IndexedDBDocProvider],
          })
      );
      workspaces.forEach(workspace => bindWorkspaceWithPages(workspace));
      workspaces.forEach(workspace => workspace.register(AffineSchemas));
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
        const ids = workspaces.map(workspace => workspace.id);
        localStorage.setItem('blocksuite-react', JSON.stringify(ids));
      }
    );
  }

  currentWorkspaceSideEffect(defaultWorkspace, store);

  return store;
};

export type CreateBlockSuiteStore = ReturnType<typeof createBlockSuiteStore>;
export type ReturnedBlockSuiteState = ReturnType<
  CreateBlockSuiteStore['getState']
>;

const BlockSuiteProviderContext = createContext<CreateBlockSuiteStore | null>(
  null
);
export function BlockSuiteProvider(
  props: React.PropsWithChildren<{
    createStore: () => CreateBlockSuiteStore;
  }>
) {
  const ref = useRef<CreateBlockSuiteStore | null>(null);
  if (ref.current === null) {
    ref.current = props.createStore();
  }
  return (
    <BlockSuiteProviderContext.Provider value={ref.current}>
      {props.children}
    </BlockSuiteProviderContext.Provider>
  );
}

export function useBlockSuiteStore(): ReturnedBlockSuiteState;
export function useBlockSuiteStore<U>(
  selector: (state: ReturnedBlockSuiteState) => U,
  equalityFn?: (a: U, b: U) => boolean
): U;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBlockSuiteStore(selector?: any, equalityFn?: any) {
  const store = useContext(BlockSuiteProviderContext);
  assertExists(store);
  return useStore(store, selector, equalityFn);
}

export function useBlockSuiteStoreApi() {
  const store = useContext(BlockSuiteProviderContext);
  assertExists(store);
  return useMemo(() => ({ ...store }), [store]);
}
