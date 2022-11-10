import type { Store, Space, BaseBlockModel } from '../../packages/store/src';

declare global {
  interface Window {
    /** Available on playground window */
    store: Store;
    blockSchema: Record<string, typeof BaseBlockModel>;
    space: Space;
  }
}
