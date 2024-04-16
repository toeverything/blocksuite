import type { TextSelection } from '@blocksuite/block-std';
import {
  type EditorHost,
  PathFinder,
  type TextRangePoint,
} from '@blocksuite/block-std';
import {
  defaultImageProxyMiddleware,
  MarkdownAdapter,
  MixTextAdapter,
  pasteMiddleware,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type {
  BlockModel,
  BlockSnapshot,
  Doc,
  DraftModel,
  SliceSnapshot,
} from '@blocksuite/store';
import { DocCollection, Job, type Slice } from '@blocksuite/store';

const updateSnapshotText = (
  point: TextRangePoint,
  snapshot: BlockSnapshot,
  model: DraftModel
) => {
  const { index, length } = point;
  if (!snapshot.props.text || length === 0) {
    return;
  }
  (snapshot.props.text as Record<string, unknown>).delta =
    model.text?.sliceToDelta(index, length + index);
};

function processSnapshot(
  snapshot: BlockSnapshot,
  text: TextSelection,
  host: EditorHost
) {
  const model = host.doc.getBlockById(snapshot.id);
  assertExists(model);

  const modelId = model.id;
  if (PathFinder.id(text.from.path) === modelId) {
    updateSnapshotText(text.from, snapshot, model);
  }
  if (text.to && PathFinder.id(text.to.path) === modelId) {
    updateSnapshotText(text.to, snapshot, model);
  }

  // If the snapshot has children, handle them recursively
  snapshot.children.forEach(childSnapshot =>
    processSnapshot(childSnapshot, text, host)
  );
}

/**
 * Processes the text in the given snapshot if there is a text selection.
 * Only the selected portion of the snapshot will be processed.
 */
function processTextInSnapshot(snapshot: SliceSnapshot, host: EditorHost) {
  const { content } = snapshot;
  const text = host.selection.find('text');
  if (!content.length || !text) return;

  content.forEach(snapshot => processSnapshot(snapshot, text, host));
}

export async function getMarkdownFromSlice(host: EditorHost, slice: Slice) {
  const job = new Job({ collection: host.std.doc.collection });
  const snapshot = await job.sliceToSnapshot(slice);
  processTextInSnapshot(snapshot, host);
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
  const job = new Job({
    collection: host.std.doc.collection,
    middlewares: [defaultImageProxyMiddleware, pasteMiddleware(host.std)],
  });
  const markdownAdapter = new MixTextAdapter();
  const { blockVersions, workspaceVersion, pageVersion } =
    host.std.doc.collection.meta;
  if (!blockVersions || !workspaceVersion || !pageVersion)
    throw new Error(
      'Need blockVersions, workspaceVersion, pageVersion meta information to get slice'
    );
  markdownAdapter.applyConfigs(job.adapterConfigs);
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

  const snapshots = snapshot.content.flatMap(x => x.children);

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

// FIXME: replace when selection is block is buggy right not
export async function replaceFromMarkdown(
  host: EditorHost,
  markdown: string,
  parent?: string,
  index?: number
) {
  const { snapshot, job } = await markdownToSnapshot(markdown, host);
  await job.snapshotToSlice(snapshot, host.doc, parent, index);
}

export async function markDownToDoc(host: EditorHost, answer: string) {
  const schema = host.std.doc.collection.schema;
  // Should not create a new doc in the original collection
  const collection = new DocCollection({ schema });
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const mdAdapter = new MarkdownAdapter();
  mdAdapter.applyConfigs(job.adapterConfigs);
  const snapshot = await mdAdapter.toDocSnapshot({
    file: answer,
    assets: job.assetsManager,
  });
  const doc = await job.snapshotToDoc(snapshot);
  if (!doc) {
    console.error('Failed to convert markdown to doc');
  }
  return doc as Doc;
}
