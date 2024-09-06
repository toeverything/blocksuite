import type { EditorHost } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import {
  defaultImageProxyMiddleware,
  MarkdownAdapter,
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

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${Math.floor(minutes)} minutes ago`;
  } else if (hours < 24) {
    return `${Math.floor(hours)} hours ago`;
  } else {
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  }
}
