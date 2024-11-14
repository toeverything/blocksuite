import type { ReferenceInfo } from '@blocksuite/affine-model';

import cloneDeep from 'lodash.clonedeep';

/**
 * Clones reference info.
 */
export function cloneReferenceInfo({ pageId, params }: ReferenceInfo) {
  const info: ReferenceInfo = { pageId };
  if (!params) return info;
  info.params = cloneDeep(params);
  return info;
}

/**
 * Returns true if it is a link to block or element.
 */
export function isLinkToNode({ params }: ReferenceInfo) {
  if (!params) return false;
  if (!params.mode) return false;
  const { blockIds, elementIds, databaseId, databaseRowId } = params;
  if (blockIds && blockIds.length > 0) return true;
  if (elementIds && elementIds.length > 0) return true;
  if (databaseId || databaseRowId) return true;
  return false;
}
