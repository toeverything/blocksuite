import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { Job, MarkdownAdapter, type Slice } from '@blocksuite/store';

export async function getMarkdownFromSlice(root: BlockSuiteRoot, slice: Slice) {
  const job = new Job({ workspace: root.std.page.workspace });
  const snapshot = await job.sliceToSnapshot(slice);
  const markdownAdapter = new MarkdownAdapter();
  const markdown = await markdownAdapter.fromSliceSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  return markdown.file;
}

export async function insertFromMarkdown(
  root: BlockSuiteRoot,
  markdown: string,
  parent?: string,
  index?: number
) {
  const job = new Job({ workspace: root.std.page.workspace });
  const markdownAdapter = new MarkdownAdapter();
  const { blockVersions, workspaceVersion, pageVersion } =
    root.std.page.workspace.meta;
  if (!blockVersions || !workspaceVersion || !pageVersion)
    throw new Error(
      'Need blockVersions, workspaceVersion, pageVersion meta information to get slice'
    );

  const payload = {
    file: markdown,
    assets: job.assetsManager,
    blockVersions,
    pageVersion,
    workspaceVersion,
    workspaceId: root.std.page.workspace.id,
    pageId: root.std.page.id,
  };

  const snapshots = (await markdownAdapter.toSliceSnapshot(payload)).content[0]
    .children;

  const models: BaseBlockModel[] = [];
  snapshots.forEach(async (blockSnapshot, i) => {
    const model = await job.snapshotToBlock(
      blockSnapshot,
      root.std.page,
      parent,
      (index ?? 0) + i
    );
    models.push(model);
  });

  return models;
}
