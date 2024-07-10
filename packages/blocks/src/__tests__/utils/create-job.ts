import {
  DocCollection,
  Job,
  type JobMiddleware,
  Schema,
} from '@blocksuite/store';

import { AffineSchemas } from '../../schemas.js';

export function createJob(middlewares?: JobMiddleware[]) {
  const schema = new Schema().register(AffineSchemas);
  const docCollection = new DocCollection({ schema });
  docCollection.meta.initialize();
  return new Job({ collection: docCollection, middlewares });
}
