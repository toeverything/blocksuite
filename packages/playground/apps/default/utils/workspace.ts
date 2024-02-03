import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  createIndexeddbStorage,
  Generator,
  Job,
  Schema,
  Text,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';

import { setupWebsocketProvider } from '../../providers/websocket-channel.js';

export const INDEXED_DB_NAME = 'PLAYGROUND_DB';

export function createDefaultPageWorkspace() {
  const blobStorages: ((id: string) => BlobStorage)[] = [
    createIndexeddbStorage,
  ];
  const idGenerator: Generator = Generator.NanoID;
  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);

  const options: WorkspaceOptions = {
    id: 'quickEdgeless',
    schema,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_bultin_ledits: true,
    },
  };
  const workspace = new Workspace(options);

  // debug info
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;

  return workspace;
}

export async function initDefaultPageWorkspace(workspace: Workspace) {
  const databaseExists = await testDefaultPageIDBExistence();
  const params = new URLSearchParams(location.search);

  const indexedDBProvider = createIndexedDBProvider(
    workspace.doc,
    INDEXED_DB_NAME
  );
  indexedDBProvider.connect();

  if (params.get('room')) {
    await setupWebsocketProvider(workspace, params.get('room') as string);
  }

  const shouldInit = !databaseExists && !params.get('room');
  if (shouldInit) {
    const page = workspace.createPage({ id: 'page:home' });
    await page.load(() => {
      const pageBlockId = page.addBlock('affine:page', {
        title: new Text(),
      });
      page.addBlock('affine:surface', {}, pageBlockId);
    });
    page.resetHistory();
  } else {
    // wait for data injected from provider
    const firstPageId =
      workspace.pages.size > 0
        ? workspace.pages.keys().next().value
        : await new Promise<string>(resolve =>
            workspace.slots.pageAdded.once(id => resolve(id))
          );
    const page = workspace.getPage(firstPageId);
    assertExists(page);

    // handle migration
    const oldMeta = localStorage.getItem('meta');
    const oldPageVersion = oldMeta ? JSON.parse(oldMeta).pageVersion : 0;
    const oldBlockVersions = oldMeta
      ? { ...JSON.parse(oldMeta).blockVersions }
      : {};

    let run = true;
    const runWorkspaceMigration = () => {
      if (run) {
        workspace.schema.upgradeWorkspace(workspace.doc);
        const meta = workspace.doc.toJSON().meta;
        localStorage.setItem('meta', JSON.stringify(meta));
        run = false;
      }
    };

    await page.load().catch(e => {
      const isValidateError =
        e instanceof Error && e.message.includes('outdated');
      if (isValidateError) {
        page.spaceDoc.once('update', () => {
          workspace.schema.upgradePage(
            oldPageVersion,
            oldBlockVersions,
            page.spaceDoc
          );
          workspace.meta.updateVersion(workspace);
          page.load().catch(console.error);
        });
        return;
      }
      throw e;
    });
    page.spaceDoc.once('update', () => {
      runWorkspaceMigration();
    });
    // finish migration

    // wait for data injected from provider
    if (!page.root) {
      await new Promise(resolve => page.slots.rootAdded.once(resolve));
    }
    page.resetHistory();
  }
}

async function testDefaultPageIDBExistence() {
  return new Promise<boolean>(resolve => {
    const req = indexedDB.open(INDEXED_DB_NAME);
    let existed = true;
    req.onsuccess = function () {
      req.result.close();
      if (!existed) {
        indexedDB.deleteDatabase(INDEXED_DB_NAME);
      }
      resolve(existed);
    };
    req.onupgradeneeded = function () {
      existed = false;
    };
  });
}
