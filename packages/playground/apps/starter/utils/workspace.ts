import {
  __unstableSchemas,
  AffineSchemas,
  TestUtils,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import {
  type BlobStorage,
  createIndexeddbStorage,
  createMemoryStorage,
  createSimpleServerStorage,
  Generator,
  Job,
  Schema,
  type StoreOptions,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';
import {
  BroadcastChannelAwarenessSource,
  BroadcastChannelDocSource,
} from '@blocksuite/sync';

import type { InitFn } from '../data/utils.js';

const params = new URLSearchParams(location.search);
const room = params.get('room');
const blobStorageArgs = (params.get('blobStorage') ?? 'memory').split(',');
const featureArgs = (params.get('features') ?? '').split(',');
const isE2E = room?.startsWith('playwright');

export function createStarterPageWorkspace() {
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  if (blobStorageArgs.includes('memory')) {
    blobStorages.push(createMemoryStorage);
  }
  if (blobStorageArgs.includes('idb')) {
    blobStorages.push(createIndexeddbStorage);
  }
  if (blobStorageArgs.includes('mock')) {
    blobStorages.push(createSimpleServerStorage);
  }

  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);
  const idGenerator = isE2E ? Generator.AutoIncrement : Generator.NanoID;

  let docSources: StoreOptions['docSources'];
  if (room) {
    docSources = {
      main: new BroadcastChannelDocSource(),
    };
  }

  const options: WorkspaceOptions = {
    id: room ?? 'starter',
    schema,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_bultin_ledits: featureArgs.includes('ledits'),
    },
    awarenessSources: [new BroadcastChannelAwarenessSource()],
    docSources,
  };
  const workspace = new Workspace(options);

  workspace.start();

  // debug info
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;
  window.testUtils = new TestUtils();

  return workspace;
}

export async function initStarterPageWorkspace(workspace: Workspace) {
  // init from other clients
  if (room && !params.has('init')) {
    let fistPage = workspace.pages.values().next().value as Page | undefined;
    if (!fistPage) {
      await new Promise<string>(resolve =>
        workspace.slots.pageAdded.once(resolve)
      );
      fistPage = workspace.pages.values().next().value;
    }
    assertExists(fistPage);
    const page = fistPage;

    page.load();
    if (!page.root) {
      await new Promise(resolve => page.slots.rootAdded.once(resolve));
    }
    page.resetHistory();
    return;
  }

  // use built-in init function
  const functionMap = new Map<
    string,
    (workspace: Workspace, id: string) => Promise<void> | void
  >();
  Object.values(
    (await import('../data/index.js')) as Record<string, InitFn>
  ).forEach(fn => functionMap.set(fn.id, fn));
  const init = params.get('init') || 'preset';
  if (functionMap.has(init)) {
    await functionMap.get(init)?.(workspace, 'page:home');
    const page = workspace.getPage('page:home');
    if (!page?.loaded) {
      page?.load();
    }
    page?.resetHistory();
  }
}
