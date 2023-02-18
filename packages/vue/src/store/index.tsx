import { builtInSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import {
  DebugDocProvider,
  IndexedDBDocProvider,
  Workspace,
} from '@blocksuite/store';
import {
  defineComponent,
  inject,
  InjectionKey,
  PropType,
  provide,
  reactive,
  ref,
  watch,
} from 'vue';

import type {
  CurrentWorkspaceActions,
  CurrentWorkspaceState,
} from './currentWorkspace/index.js';
import {
  createCurrentWorkspaceState,
  currentWorkspaceSideEffect,
} from './currentWorkspace/index.js';
import type { ManagerActions, ManagerState } from './manager/index.js';
import { bindWorkspaceWithPages, createManagerState } from './manager/index.js';

const StoreKey = 'block-suite-vue';

export interface BlockSuiteState extends ManagerState, CurrentWorkspaceState {}

export interface BlockSuiteActions
  extends ManagerActions,
    CurrentWorkspaceActions {}

export const createBlockSuiteStore = (defaultWorkspace: Workspace) => {
  const store = reactive({
    ...createManagerState(defaultWorkspace),
    ...createCurrentWorkspaceState(defaultWorkspace),
  });

  if (typeof window !== 'undefined') {
    const str = localStorage.getItem(StoreKey) ?? '';
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
      window.setTimeout(() => (store.workspaces = workspaces), 0);
    } catch (e) {
      // ignore
    }

    watch(
      () => store.workspaces,
      workspaces => {
        const rooms = workspaces.map(workspace => workspace.room);
        localStorage.setItem(StoreKey, JSON.stringify(rooms));
      }
    );
  }

  currentWorkspaceSideEffect(defaultWorkspace, store);

  return store;
};

export type CreateBlockSuiteStore = ReturnType<typeof createBlockSuiteStore>;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBlockSuiteStore() {
  const store = inject(BlockSuiteProviderKey);
  assertExists(store?.store);
  return store.store;
}

export function useBlockSuiteStoreApi() {
  const store = inject(BlockSuiteProviderKey);
  assertExists(store);
  return {
    ...store.store,
  };
}
