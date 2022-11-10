// Import for BlockSuitePlaygroundInitKey
import type {} from '../../packages/playground/src/inits';
import type { Space, Store } from '../../packages/store/src';

declare global {
  interface Window {
    /** Available on playground window */
    store: Store;
    space: Space;
  }
}
