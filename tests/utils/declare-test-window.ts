import type { Store } from '../../packages/store/src';

declare global {
  interface Window {
    /** Available on playground window */
    store: Store;
  }
}
