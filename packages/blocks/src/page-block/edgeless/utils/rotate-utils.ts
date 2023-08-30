import type { EdgelessElement } from '../../../index.js';
import { isTopLevelBlock } from './query.js';

export function getRotation(element: EdgelessElement) {
  return isTopLevelBlock(element) ? 0 : element.rotate ?? 0;
}
