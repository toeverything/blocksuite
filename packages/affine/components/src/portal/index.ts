export { createLitPortal, createSimplePortal } from './helper.js';
export { Portal } from './portal.js';
export type * from './types.js';

import { Portal } from './portal.js';

export function effects() {
  customElements.define('blocksuite-portal', Portal);
}
