import { DocCollection, Job, Schema } from '@blocksuite/store';

export function createJob() {
  const schema = new Schema();
  const docCollection = new DocCollection({ schema });
  return new Job({ collection: docCollection });
}
