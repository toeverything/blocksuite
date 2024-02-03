import {
  __unstableSchemas,
  AffineSchemas,
  TestUtils,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  createIndexeddbStorage,
  createMemoryStorage,
  createSimpleServerStorage,
  Generator,
  Job,
  Schema,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';

import { setupBroadcastProvider } from '../../providers/broadcast-channel.js';
import type { InitFn } from '../data/utils.js';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
const blobStorageArgs = (params.get('blobStorage') ?? 'memory').split(',');
const featureArgs = (params.get('features') ?? '').split(',');
const isE2E = room.startsWith('playwright');

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

  const options: WorkspaceOptions = {
    id: room,
    schema,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_bultin_ledits: featureArgs.includes('ledits'),
    },
  };
  const workspace = new Workspace(options);

  // debug info
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;
  window.testUtils = new TestUtils();

  return workspace;
}

export async function initStarterPageWorkspace(workspace: Workspace) {
  const functionMap = new Map<
    string,
    (workspace: Workspace, id: string) => Promise<void>
  >();
  Object.values(
    (await import('../data/index.js')) as Record<string, InitFn>
  ).forEach(fn => functionMap.set(fn.id, fn));

  if (params.get('room')) {
    setupBroadcastProvider(workspace);
    if (!params.get('init')) {
      // wait for data injected from provider
      const firstPageId = await new Promise<string>(resolve =>
        workspace.slots.pageAdded.once(id => resolve(id))
      );
      const page = workspace.getPage(firstPageId);
      assertExists(page);
      await page.load();
      if (!page.root) {
        await new Promise(resolve => page.slots.rootAdded.once(resolve));
      }
      page.resetHistory();
      return;
    }
  }

  const init = params.get('init') || 'preset';
  // Load built-in init function when `?init=heavy` param provided
  if (functionMap.has(init)) {
    await functionMap.get(init)?.(workspace, 'page:home');
    const page = workspace.getPage('page:home');
    if (!page?.loaded) {
      await page?.load();
    }
    page?.resetHistory();
  }
}
