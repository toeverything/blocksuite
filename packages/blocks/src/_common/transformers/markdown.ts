import type { Doc } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import { Job } from '@blocksuite/store';

import { MarkdownAdapter } from '../adapters/index.js';
import { defaultImageProxyMiddleware } from './middlewares.js';
import { createAssetsArchive, download } from './utils.js';

async function exportDoc(doc: Doc) {
  const job = new Job({ collection: doc.collection });
  const snapshot = await job.docToSnapshot(doc);

  const adapter = new MarkdownAdapter(job);
  if (!snapshot) {
    return;
  }

  const markdownResult = await adapter.fromDocSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  let downloadBlob: Blob;
  const docTitle = doc.meta?.title || 'Untitled';
  let name: string;
  const contentBlob = new Blob([markdownResult.file], { type: 'plain/text' });
  if (markdownResult.assetsIds.length > 0) {
    if (!job.assets) {
      throw new BlockSuiteError(ErrorCode.ValueNotExists, 'No assets found');
    }
    const zip = await createAssetsArchive(job.assets, markdownResult.assetsIds);

    await zip.file('index.md', contentBlob);

    downloadBlob = await zip.generate();
    name = `${docTitle}.zip`;
  } else {
    downloadBlob = contentBlob;
    name = `${docTitle}.md`;
  }
  download(downloadBlob, name);
}

type ImportMarkdownOptions = {
  doc: Doc;
  markdown: string;
  noteId: string;
};

async function importMarkdown({
  doc,
  markdown,
  noteId,
}: ImportMarkdownOptions) {
  const job = new Job({
    collection: doc.collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const adapter = new MarkdownAdapter(job);
  const snapshot = await adapter.toSliceSnapshot({
    file: markdown,
    assets: job.assetsManager,
    pageVersion: doc.collection.meta.pageVersion!,
    workspaceVersion: doc.collection.meta.workspaceVersion!,
    workspaceId: doc.collection.id,
    pageId: doc.id,
  });

  assertExists(snapshot, 'import markdown failed, expected to get a snapshot');

  const blocks = snapshot.content.flatMap(x => x.children);

  for (const block of blocks) {
    await job.snapshotToBlock(block, doc, noteId);
  }

  return;
}

export const MarkdownTransformer = {
  exportDoc,
  importMarkdown,
};
