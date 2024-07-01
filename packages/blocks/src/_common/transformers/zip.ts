import { assertExists, sha } from '@blocksuite/global/utils';
import type {
  CollectionInfoSnapshot,
  Doc,
  DocCollection,
  DocSnapshot,
  JobMiddleware,
} from '@blocksuite/store';
import { extMimeMap, getAssetName, Job } from '@blocksuite/store';
import JSZip from 'jszip';

import { replaceIdMiddleware, titleMiddleware } from './middlewares.js';

async function exportDocs(collection: DocCollection, docs: Doc[]) {
  const zip = new JSZip();

  const job = new Job({ collection });
  const snapshots = await Promise.all(docs.map(job.docToSnapshot));

  const collectionInfo = job.collectionInfoToSnapshot();
  zip.file('info.json', JSON.stringify(collectionInfo, null, 2));

  snapshots.forEach(snapshot => {
    const snapshotName = `${snapshot.meta.id}.snapshot.json`;
    zip.file(snapshotName, JSON.stringify(snapshot, null, 2));
  });

  const assets = zip.folder('assets');
  assertExists(assets);
  const assetsMap = job.assets;

  assetsMap.forEach((blob, id) => {
    const ext = getAssetName(assetsMap, id).split('.').at(-1);
    const name = `${id}.${ext}`;
    assets.file(name, blob);
  });

  return zip.generateAsync({ type: 'blob' });
}

async function importDocs(collection: DocCollection, imported: Blob) {
  const zip = new JSZip();
  const { files } = await zip.loadAsync(imported);

  const assetObjs: JSZip.JSZipObject[] = [];
  const snapshotsObjs: JSZip.JSZipObject[] = [];
  let infoObj: JSZip.JSZipObject | undefined;
  let info: CollectionInfoSnapshot | undefined;

  Object.entries(files).map(([name, fileObj]) => {
    if (name.includes('MACOSX') || name.includes('DS_Store')) {
      return;
    }

    if (name.startsWith('assets/') && !fileObj.dir) {
      assetObjs.push(fileObj);
      return;
    }

    if (name === 'info.json') {
      infoObj = fileObj;
      return;
    }

    if (name.endsWith('.snapshot.json')) {
      snapshotsObjs.push(fileObj);
      return;
    }
  });

  {
    const json = await infoObj?.async('text');
    assertExists(json);
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
    assetObjs.map(async fileObj => {
      const nameWithExt = fileObj.name.replace('assets/', '');
      const assetsId = nameWithExt.replace(/\.[^/.]+$/, '');
      const blob = await fileObj.async('blob');
      const ext = nameWithExt.split('.').at(-1) ?? '';
      const mime = extMimeMap.get(ext) ?? '';
      const file = new File([blob], nameWithExt, {
        type: mime,
      });
      assetsMap.set(assetsId, file);
    })
  );

  return Promise.all(
    snapshotsObjs.map(async fileObj => {
      const json = await fileObj.async('text');
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
