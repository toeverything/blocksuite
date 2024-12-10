import {
  DocCollection,
  Job,
  type JobMiddleware,
  Schema,
} from '@blocksuite/store';

import { defaultImageProxyMiddleware } from '../../_common/transformers/middlewares.js';
import { AffineSchemas } from '../../schemas.js';

declare global {
  interface Window {
    happyDOM: {
      settings: {
        fetch: {
          disableSameOriginPolicy: boolean;
        };
      };
    };
  }
}

export function createJob(middlewares?: JobMiddleware[]) {
  window.happyDOM.settings.fetch.disableSameOriginPolicy = true;
  const testMiddlewares = middlewares ?? [];
  testMiddlewares.push(defaultImageProxyMiddleware);
  const schema = new Schema().register(AffineSchemas);
  const docCollection = new DocCollection({ schema });
  docCollection.meta.initialize();
  return new Job({ collection: docCollection, middlewares: testMiddlewares });
}
