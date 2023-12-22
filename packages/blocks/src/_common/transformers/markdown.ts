import type { Page } from '@blocksuite/store';
import { Job } from '@blocksuite/store';

import { MarkdownAdapter } from '../adapters/index.js';
import { createAssetsArchive, download } from './utils.js';

export async function exportPage(page: Page) {
  const job = new Job({ workspace: page.workspace });
  const snapshot = await job.pageToSnapshot(page);

  const adapter = new MarkdownAdapter();

  const markdownResult = await adapter.fromPageSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  let downloadBlob: Blob;
  const pageTitle = page.meta.title || 'Untitled';
  let name: string;
  const contentBlob = new Blob([markdownResult.file], { type: 'plain/text' });
  if (markdownResult.assetsIds.length > 0) {
    const zip = createAssetsArchive(job.assets, markdownResult.assetsIds);

    zip.file('index.md', contentBlob);

    downloadBlob = await zip.generateAsync({ type: 'blob' });
    name = `${pageTitle}.zip`;
  } else {
    downloadBlob = contentBlob;
    name = `${pageTitle}.md`;
  }
  download(downloadBlob, name);
}

type ImportMarkdownOptions = {
  page: Page;
  markdown: string;
  noteId: string;
  index?: number;
};

export async function importMarkdown({
  page,
  markdown,
  noteId,
  index,
}: ImportMarkdownOptions) {
  const job = new Job({ workspace: page.workspace });
  const adapter = new MarkdownAdapter();
  const snapshot = await adapter.toSliceSnapshot({
    file: markdown,
    assets: job.assetsManager,
    blockVersions: page.workspace.meta.blockVersions!,
    pageVersion: page.workspace.meta.pageVersion!,
    workspaceVersion: page.workspace.meta.workspaceVersion!,
    workspaceId: page.workspace.id,
    pageId: page.id,
  });

  await Promise.all(
    snapshot.content
      .flatMap(x => x.children)
      .map(async (block, i) => {
        await job.snapshotToBlock(
          block,
          page,
          noteId,
          index != null ? index + i : undefined
        );
      })
  );

  return;
}
