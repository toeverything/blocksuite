import type { Page } from '@blocksuite/store';
import { Job } from '@blocksuite/store';

import { HtmlAdapter } from '../adapters/index.js';
import { createAssetsArchive, download } from './utils.js';

export async function exportPage(page: Page) {
  const job = new Job({ workspace: page.workspace });
  const snapshot = await job.pageToSnapshot(page);
  const adapter = new HtmlAdapter();
  const htmlResult = await adapter.fromPageSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  let downloadBlob: Blob;
  const pageTitle = page.meta.title || 'Untitled';
  let name: string;
  const contentBlob = new Blob([htmlResult.file], { type: 'plain/text' });
  if (htmlResult.assetsIds.length > 0) {
    const zip = createAssetsArchive(job.assets, htmlResult.assetsIds);

    zip.file('index.html', contentBlob);

    downloadBlob = await zip.generateAsync({ type: 'blob' });
    name = `${pageTitle}.zip`;
  } else {
    downloadBlob = contentBlob;
    name = `${pageTitle}.html`;
  }
  download(downloadBlob, name);
}
