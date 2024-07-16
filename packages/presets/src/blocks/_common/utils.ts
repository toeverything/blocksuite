import type { EditorHost } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import {
  MarkdownAdapter,
  defaultImageProxyMiddleware,
} from '@blocksuite/blocks';
import { DocCollection, Job } from '@blocksuite/store';

export async function markDownToDoc(host: EditorHost, answer: string) {
  const schema = host.std.doc.collection.schema;
  // Should not create a new doc in the original collection
  const collection = new DocCollection({ schema });
  collection.meta.initialize();
  const job = new Job({
    collection,
    middlewares: [defaultImageProxyMiddleware],
  });
  const mdAdapter = new MarkdownAdapter(job);
  const doc = await mdAdapter.toDoc({
    file: answer,
    assets: job.assetsManager,
  });
  if (!doc) {
    console.error('Failed to convert markdown to doc');
  }
  return doc as Doc;
}
