import { builtInSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import { DebugDocProvider, Workspace } from '@blocksuite/store';
import { IndexedDBDocProvider } from '@blocksuite/store';
import { defineComponent, inject, InjectionKey, PropType, provide } from 'vue';
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
    const str = localStorage.getItem('blocksuite-react') ?? '';
    try {
      const data = JSON.parse(str);
      const workspaces: Workspace[] = data.map(
        (room: string) =>
          new Workspace({
            room,
            providers: [DebugDocProvider, IndexedDBDocProvider],
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
export type ReturnedBlockSuiteState = ReturnType<
  CreateBlockSuiteStore['getState']
>;

export const BlockSuiteProviderKey: InjectionKey<{
  store: CreateBlockSuiteStore;
}> = Symbol('BlockSuiteProvider');
export const BlockSuiteProvider = defineComponent({
  name: 'BlockSuiteProvider',
  props: {
    createStore: {
      type: Function as PropType<() => CreateBlockSuiteStore>,
      required: true,
    },
  },
  setup(props, { slots }) {
    const store = props.createStore();
    provide(BlockSuiteProviderKey, {
      store,
    });
    return () => <>{slots.default?.()}</>;
  },
});

export function useBlockSuiteStore(): ReturnedBlockSuiteState;
export function useBlockSuiteStore<U>(
  selector: (state: ReturnedBlockSuiteState) => U,
  equalityFn?: (a: U, b: U) => boolean
): U;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBlockSuiteStore(selector?: any, equalityFn?: any) {
  const store = inject(BlockSuiteProviderKey);
  assertExists(store?.store);
  return useStore(store.store, selector, equalityFn);
}

export function useBlockSuiteStoreApi() {
  const store = inject(BlockSuiteProviderKey);
  assertExists(store);
  return {
    ...store.store,
  };
}
