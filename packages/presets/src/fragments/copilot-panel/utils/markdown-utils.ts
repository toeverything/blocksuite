import type { EditorHost } from '@blocksuite/block-std';
import { MarkdownAdapter } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { Job, type Slice } from '@blocksuite/store';

export async function getMarkdownFromSlice(host: EditorHost, slice: Slice) {
  const job = new Job({ collection: host.std.doc.collection });
  const snapshot = await job.sliceToSnapshot(slice);
  const markdownAdapter = new MarkdownAdapter();
  const markdown = await markdownAdapter.fromSliceSnapshot({
    snapshot,
    assets: job.assetsManager,
  });

  return markdown.file;
}
export const markdownToSnapshot = async (
  markdown: string,
  host: EditorHost
) => {
  const job = new Job({ collection: host.std.doc.collection });
  const markdownAdapter = new MarkdownAdapter();
  const { blockVersions, workspaceVersion, pageVersion } =
    host.std.doc.collection.meta;
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
    workspaceId: host.std.doc.collection.id,
    pageId: host.std.doc.id,
  };

  const snapshot = await markdownAdapter.toSliceSnapshot(payload);
  assertExists(snapshot, 'import markdown failed, expected to get a snapshot');

  return {
    snapshot,
    job,
  };
};
export async function insertFromMarkdown(
  host: EditorHost,
  markdown: string,
  parent?: string,
  index?: number
) {
  const { snapshot, job } = await markdownToSnapshot(markdown, host);

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
