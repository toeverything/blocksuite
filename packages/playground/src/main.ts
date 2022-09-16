import { PageBlockElement } from '@building-blocks/blocks';
import { noop } from './utils';

window.onload = () => {
  // avoid being tree-shaked
  noop(PageBlockElement);

  const pageBlock = document.createElement('page-container');
  document.body.appendChild(pageBlock);
};
