import type { Doc, DocCollection } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import { extMimeMap, Job } from '@blocksuite/store';

import { MarkdownAdapter } from '../adapters/index.js';
import {
  defaultImageProxyMiddleware,
  fileNameMiddleware,
} from './middlewares.js';
import { createAssetsArchive, download, Unzip } from './utils.js';

type ImportMarkdownToBlockOptions = {
  doc: Doc;
  markdown: string;
  blockId: string;
};

type ImportMarkdownToDocOptions = {
  collection: DocCollection;
  markdown: string;
  fileName?: string;
};

type ImportMarkdownZipOptions = {
  collection: DocCollection;
  imported: Blob;
};

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

async function importMarkdownToBlock({
  doc,
  markdown,
  blockId,
}: ImportMarkdownToBlockOptions) {
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
    await job.snapshotToBlock(block, doc, blockId);
  }

  return;
}

async function importMarkdownToDoc({
  collection,
  markdown,
  fileName,
}: ImportMarkdownToDocOptions) {
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware, fileNameMiddleware(fileName)],
  });
  const mdAdapter = new MarkdownAdapter(job);
  const page = await mdAdapter.toDoc({
    file: markdown,
    assets: job.assetsManager,
  });
  if (!page) {
    return;
  }
  return page.id;
}

async function importMarkdownZip({
  collection,
  imported,
}: ImportMarkdownZipOptions) {
  const unzip = new Unzip();
  await unzip.load(imported);

  const assetBlobs: [string, Blob][] = [];
  const markdownBlobs: Blob[] = [];

  for (const { path, content: blob } of unzip) {
    if (path.includes('MACOSX') || path.includes('DS_Store')) {
      continue;
    }

    // TODO: assets may not be in the assets/ folder, should find a better way to handle it
    if (path.startsWith('assets/')) {
      assetBlobs.push([path, blob]);
      continue;
    }

    if (path.endsWith('.md')) {
      markdownBlobs.push(blob);
    }
  }

  // TODO: find a way to set title of each doc from file name
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const assetsMap = job.assets;
  const mdAdapter = new MarkdownAdapter(job);

  // TODO: assets may not be in the assets/ folder, should find a better way to handle it
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
    markdownBlobs.map(async blob => {
      const markdown = await blob.text();
      return mdAdapter.toDoc({ file: markdown, assets: job.assetsManager });
    })
  );
}

export const MarkdownTransformer = {
  exportDoc,
  importMarkdownToBlock,
  importMarkdownToDoc,
  importMarkdownZip,
};
