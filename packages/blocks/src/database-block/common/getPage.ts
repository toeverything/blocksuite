import type { Page } from '@blocksuite/store';

export const getPageInstance = (ele: HTMLElement): Page | undefined => {
  return ele.closest('block-suite-root')?.page;
};
