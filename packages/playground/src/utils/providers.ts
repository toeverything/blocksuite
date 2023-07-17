import type { DocProviderCreator } from '@blocksuite/store';

import { IndexedDBProviderWrapper } from '../providers/indexdb-provider';
import { params } from '../utils';

export function getProviderCreators() {
  const providerCreators: DocProviderCreator[] = [];

  if (!params.get('room')) {
    providerCreators.push((id, doc) => new IndexedDBProviderWrapper(id, doc));
  }

  return providerCreators;
}
