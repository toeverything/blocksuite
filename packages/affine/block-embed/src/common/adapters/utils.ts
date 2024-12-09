import type { ReferenceParams } from '@blocksuite/affine-model';

import { toURLSearchParams } from '@blocksuite/affine-shared/adapters';

export function generateDocUrl(
  docBaseUrl: string,
  pageId: string,
  params: ReferenceParams
) {
  const search = toURLSearchParams(params);
  const query = search?.size ? `?${search.toString()}` : '';
  const url = docBaseUrl ? `${docBaseUrl}/${pageId}${query}` : '';
  return url;
}
