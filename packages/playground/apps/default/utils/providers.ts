import type { DocProviderCreator } from '@blocksuite/store';

import { IndexedDBProviderWrapper } from '../providers/indexeddb-provider';
import { params } from '../utils';

export function getProviderCreators() {
  const providerCreators: DocProviderCreator[] = [];

  if (!params.get('room')) {
    providerCreators.push((_id, doc) => new IndexedDBProviderWrapper(doc));
  }

  return providerCreators;
}
