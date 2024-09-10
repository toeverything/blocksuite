import { replaceIdMiddleware } from '@blocksuite/blocks';
import { type DocCollection, type DocSnapshot, Job } from '@blocksuite/store';

export async function importFromSnapshot(
  collection: DocCollection,
  snapshot: DocSnapshot
) {
  const job = new Job({
    collection,
    middlewares: [replaceIdMiddleware],
  });

  return job.snapshotToDoc(snapshot);
}
