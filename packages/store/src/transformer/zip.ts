import { assertExists } from '@blocksuite/global/utils';
import JSZip from 'jszip';

import type { Page, Workspace } from '../workspace/index.js';
import { Job } from './job.js';
import type { PageSnapshot, WorkspaceInfoSnapshot } from './type.js';

export async function exportPagesZip(workspace: Workspace, pages: Page[]) {
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
    const name = blob.name;
    const ext = name.split('.').at(-1) ?? 'blob';
    assets.file(`${id}.${ext}`, blob);
  });

  return zip.generateAsync({ type: 'blob' });
}

export async function importPagesZip(workspace: Workspace, imported: Blob) {
  const zip = new JSZip();
  const job = new Job({ workspace });
  const assetsMap = job.assets;
  const { files } = await zip.loadAsync(imported);

  const assetObjs: JSZip.JSZipObject[] = [];
  const snapshotsObjs: JSZip.JSZipObject[] = [];
  let infoObj: JSZip.JSZipObject | undefined;

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

  await Promise.all(
    assetObjs.map(async fileObj => {
      const nameWithExt = fileObj.name.replace('assets/', '');
      const assetsId = nameWithExt.replace(/\.[^/.]+$/, '');
      const blob = await fileObj.async('blob');
      const file = new File([blob], nameWithExt);
      assetsMap.set(assetsId, file);
    })
  );

  {
    const json = await infoObj?.async('text');
    assertExists(json);
    const info = JSON.parse(json) as WorkspaceInfoSnapshot;
    job.snapshotToWorkspaceInfo(info);
  }

  const pages = await Promise.all(
    snapshotsObjs.map(async fileObj => {
      const json = await fileObj.async('text');
      const snapshot = JSON.parse(json) as PageSnapshot;

      // TODO: use middleware to handle snapshot transform
      snapshot.meta.id = workspace.idGenerator();

      const page = await job.snapshotToPage(snapshot);
      return page;
    })
  );

  return pages;
}
