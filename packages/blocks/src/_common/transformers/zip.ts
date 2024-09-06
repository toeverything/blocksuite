import type {
  CollectionInfoSnapshot,
  Doc,
  DocCollection,
  DocSnapshot,
  JobMiddleware,
} from '@blocksuite/store';

import { sha } from '@blocksuite/global/utils';
import { extMimeMap, getAssetName, Job } from '@blocksuite/store';

import { Unzip, Zip } from '../transformers/utils.js';
import { replaceIdMiddleware, titleMiddleware } from './middlewares.js';

async function exportDocs(collection: DocCollection, docs: Doc[]) {
  const zip = new Zip();
  const job = new Job({ collection });
  const snapshots = await Promise.all(docs.map(job.docToSnapshot));

  const collectionInfo = job.collectionInfoToSnapshot();
  await zip.file('info.json', JSON.stringify(collectionInfo, null, 2));

  await Promise.all(
    snapshots
      .filter((snapshot): snapshot is DocSnapshot => !!snapshot)
      .map(async snapshot => {
        const snapshotName = `${snapshot.meta.id}.snapshot.json`;
        await zip.file(snapshotName, JSON.stringify(snapshot, null, 2));
      })
  );

  const assets = zip.folder('assets');
  const assetsMap = job.assets;

  for (const [id, blob] of assetsMap) {
    const ext = getAssetName(assetsMap, id).split('.').at(-1);
    const name = `${id}.${ext}`;
    await assets.file(name, blob);
  }

  return zip.generate();
}

async function importDocs(collection: DocCollection, imported: Blob) {
  const unzip = new Unzip();
  await unzip.load(imported);

  const assetBlobs: [string, Blob][] = [];
  const snapshotsBlobs: Blob[] = [];
  let infoBlob: Blob | undefined;
  let info: CollectionInfoSnapshot | undefined;

  for (const { path, content: blob } of unzip) {
    if (path.includes('MACOSX') || path.includes('DS_Store')) {
      continue;
    }

    if (path.startsWith('assets/')) {
      assetBlobs.push([path, blob]);
      continue;
    }

    if (path === 'info.json') {
      infoBlob = blob;
      continue;
    }

    if (path.endsWith('.snapshot.json')) {
      snapshotsBlobs.push(blob);
      continue;
    }
  }

  {
    const json = (await infoBlob?.text()) ?? '';
    info = JSON.parse(json) as CollectionInfoSnapshot;
  }

  const migrationMiddleware: JobMiddleware = ({ slots, collection }) => {
    slots.afterImport.on(payload => {
      if (payload.type === 'page') {
        collection.schema.upgradeDoc(
          info?.pageVersion ?? 0,
          {},
          payload.page.spaceDoc
        );
      }
    });
  };
  const job = new Job({
    collection,
    middlewares: [replaceIdMiddleware, migrationMiddleware, titleMiddleware],
  });
  const assetsMap = job.assets;

  await Promise.all(
    assetBlobs.map(([name, blob]) => {
      const nameWithExt = name.replace('assets/', '');
      const assetsId = nameWithExt.replace(/\.[^/.]+$/, '');
      const ext = nameWithExt.split('.').at(-1) ?? '';
      const mime = extMimeMap.get(ext) ?? '';
      const file = new File([blob], nameWithExt, {
        type: mime,
      });
      assetsMap.set(assetsId, file);
    })
  );

  return Promise.all(
    snapshotsBlobs.map(async blob => {
      const json = await blob.text();
      const snapshot = JSON.parse(json) as DocSnapshot;
      const tasks: Promise<void>[] = [];

      job.walk(snapshot, block => {
        const sourceId = block.props?.sourceId as string | undefined;

        if (sourceId && sourceId.startsWith('/')) {
          const removeSlashId = sourceId.replace(/^\//, '');

          if (assetsMap.has(removeSlashId)) {
            const blob = assetsMap.get(removeSlashId)!;

            tasks.push(
              blob
                .arrayBuffer()
                .then(buffer => sha(buffer))
                .then(hash => {
                  assetsMap.set(hash, blob);
                  block.props.sourceId = hash;
                })
            );
          }
        }
      });

      await Promise.all(tasks);

      return job.snapshotToDoc(snapshot);
    })
  );
}

export const ZipTransformer = {
  exportDocs,
  importDocs,
};
