import { assertExists } from '@blocksuite/global/utils';
import type {
  JobMiddleware,
  Page,
  PageSnapshot,
  Workspace,
  WorkspaceInfoSnapshot,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import JSZip from 'jszip';

import { replaceIdMiddleware } from './utils.js';

export async function exportPages(workspace: Workspace, pages: Page[]) {
  const zip = new JSZip();

  const job = new Job({ workspace });
  const snapshots = await Promise.all(pages.map(job.pageToSnapshot));

  const workspaceInfo = job.workspaceInfoToSnapshot();
  zip.file('info.json', JSON.stringify(workspaceInfo, null, 2));

  snapshots.forEach(snapshot => {
    const snapshotName = `${snapshot.meta.id}.snapshot.json`;
    zip.file(snapshotName, JSON.stringify(snapshot, null, 2));
  });

  const assets = zip.folder('assets');
  assertExists(assets);
  const assetsMap = job.assets;

  assetsMap.forEach((blob, id) => {
    const name = (blob as File).name;
    const ext = name.split('.').at(-1) ?? 'blob';
    assets.file(`${id}.${ext}`, blob);
  });

  return zip.generateAsync({ type: 'blob' });
}

export async function importPages(workspace: Workspace, imported: Blob) {
  const zip = new JSZip();
  const { files } = await zip.loadAsync(imported);

  const assetObjs: JSZip.JSZipObject[] = [];
  const snapshotsObjs: JSZip.JSZipObject[] = [];
  let infoObj: JSZip.JSZipObject | undefined;
  let info: WorkspaceInfoSnapshot | undefined;

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
    info = JSON.parse(json) as WorkspaceInfoSnapshot;
  }

  const migrationMiddleware: JobMiddleware = ({ slots, workspace }) => {
    slots.afterImport.on(payload => {
      if (payload.type === 'page') {
        workspace.schema.upgradePage(
          info?.pageVersion ?? 0,
          info?.blockVersions ?? {},
          payload.page.spaceDoc
        );
      }
    });
  };
  const job = new Job({
    workspace,
    middlewares: [replaceIdMiddleware, migrationMiddleware],
  });
  const assetsMap = job.assets;

  job.snapshotToWorkspaceInfo(info);

  await Promise.all(
    assetObjs.map(async fileObj => {
      const nameWithExt = fileObj.name.replace('assets/', '');
      const assetsId = nameWithExt.replace(/\.[^/.]+$/, '');
      const blob = await fileObj.async('blob');
      const file = new File([blob], nameWithExt);
      assetsMap.set(assetsId, file);
    })
  );

  return Promise.all(
    snapshotsObjs.map(async fileObj => {
      const json = await fileObj.async('text');
      const snapshot = JSON.parse(json) as PageSnapshot;

      return job.snapshotToPage(snapshot);
    })
  );
}
