import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
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

import { INDEXED_DB_NAME, setupProviders, testIDBExistence } from './providers';

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
    providerCreators: [],
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_bultin_ledits: true,
      readonly: {
        'page:home': false,
      },
    },
  };
  const workspace = new Workspace(options);

  // debug info
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;
  Object.defineProperty(globalThis, 'host', {
    get() {
      return document.querySelector<EditorHost>('editor-host');
    },
  });

  return workspace;
}

export async function initDefaultPageWorkspace(workspace: Workspace) {
  const databaseExists = await testIDBExistence();

  const params = new URLSearchParams(location.search);
  const shouldInit =
    (!databaseExists && !params.get('room')) || params.get('init');

  if (shouldInit) {
    const deleteResult = await new Promise(resolve => {
      const req = indexedDB.deleteDatabase(INDEXED_DB_NAME);
      req.onerror = resolve;
      req.onblocked = resolve;
      req.onsuccess = resolve;
    });

    console.info('Delete database: ', deleteResult);

    await setupProviders(workspace);
    const page = workspace.createPage({ id: 'page:home' });
    await page.load(() => {
      const pageBlockId = page.addBlock('affine:page', {
        title: new Text(),
      });
      page.addBlock('affine:surface', {}, pageBlockId);
    });
    page.resetHistory();
  } else {
    await setupProviders(workspace);
    const firstPageId = await new Promise<string>(resolve =>
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

    if (!page.root) {
      await new Promise(resolve => page.slots.rootAdded.once(resolve));
    }
    page.resetHistory();
  }
}
