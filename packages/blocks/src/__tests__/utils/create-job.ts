import { DocCollection, Job, Schema } from '@blocksuite/store';

export function createJob() {
  const schema = new Schema();
  const collection = new DocCollection({ schema });
  collection.meta.initialize();
  return new Job({ collection });
}
