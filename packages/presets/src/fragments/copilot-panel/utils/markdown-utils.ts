import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { MarkdownAdapter } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { Job, type Slice } from '@blocksuite/store';

export async function getMarkdownFromSlice(host: EditorHost, slice: Slice) {
  const job = new Job({ collection: host.std.doc.collection });
  const markdownAdapter = new MarkdownAdapter(job);
  const markdown = await markdownAdapter.fromSlice(slice);

  return markdown.file;
}
export const markdownToSnapshot = async (
  markdown: string,
  host: EditorHost
) => {
  const job = new Job({ collection: host.std.doc.collection });
  const markdownAdapter = new MarkdownAdapter(job);
  const { blockVersions, pageVersion, workspaceVersion } =
    host.std.doc.collection.meta;
  if (!blockVersions || !workspaceVersion || !pageVersion)
    throw new Error(
      'Need blockVersions, workspaceVersion, pageVersion meta information to get slice'
    );

  const payload = {
    assets: job.assetsManager,
    blockVersions,
    file: markdown,
    pageId: host.std.doc.id,
    pageVersion,
    workspaceId: host.std.doc.collection.id,
    workspaceVersion,
  };

  const snapshot = await markdownAdapter.toSliceSnapshot(payload);
  assertExists(snapshot, 'import markdown failed, expected to get a snapshot');

  return {
    job,
    snapshot,
  };
};
export async function insertFromMarkdown(
  host: EditorHost,
  markdown: string,
  parent?: string,
  index?: number
) {
  const { job, snapshot } = await markdownToSnapshot(markdown, host);

  const snapshots = snapshot.content[0].children;

  const models: BlockModel[] = [];
  for (let i = 0; i < snapshots.length; i++) {
    const blockSnapshot = snapshots[i];
    const model = await job.snapshotToBlock(
      blockSnapshot,
      host.std.doc,
      parent,
      (index ?? 0) + i
    );
    models.push(model);
  }

  return models;
}
