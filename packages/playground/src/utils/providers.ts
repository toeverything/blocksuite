import type { DocProviderCreator } from '@blocksuite/store';

import { IndexedDBProviderWrapper } from '../providers/indexdb-provider';
import { params } from '../utils';

export function getProviderCreators() {
  const providerCreators: DocProviderCreator[] = [];
  const providerArgs = (params.get('providers') ?? '').split(',');

  if (!providerArgs.includes('room')) {
    providerCreators.push((id, doc) => new IndexedDBProviderWrapper(id, doc));
  }

  return providerCreators;
}
