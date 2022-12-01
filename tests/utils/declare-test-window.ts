import type { Workspace, Page, BaseBlockModel } from '../../packages/store/src';

declare global {
  interface Window {
    /** Available on playground window */
    workspace: Workspace;
    blockSchema: Record<string, typeof BaseBlockModel>;
    page: Page;
  }
}
