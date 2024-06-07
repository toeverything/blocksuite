import type { Doc } from '@blocksuite/store';
import { Job } from '@blocksuite/store';

import { HtmlAdapter } from '../adapters/index.js';
import { createAssetsArchive, download } from './utils.js';

async function exportDoc(doc: Doc) {
  const job = new Job({ collection: doc.collection });
  const snapshot = await job.docToSnapshot(doc);
  const adapter = new HtmlAdapter(job);
  const htmlResult = await adapter.fromDocSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  let downloadBlob: Blob;
  const docTitle = doc.meta?.title || 'Untitled';
  let name: string;
  const contentBlob = new Blob([htmlResult.file], { type: 'plain/text' });
  if (htmlResult.assetsIds.length > 0) {
    const zip = createAssetsArchive(job.assets, htmlResult.assetsIds);

    zip.file('index.html', contentBlob);

    downloadBlob = await zip.generateAsync({ type: 'blob' });
    name = `${docTitle}.zip`;
  } else {
    downloadBlob = contentBlob;
    name = `${docTitle}.html`;
  }
  download(downloadBlob, name);
}

export const HtmlTransformer = {
  exportDoc,
};
