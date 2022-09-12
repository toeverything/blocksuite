import { PageBlockElement } from '@building-blocks/blocks';
import { noop } from './utils';

window.onload = () => {
  // avoid being tree-shaked
  noop(PageBlockElement);

  const pageBlock = document.createElement('page-block-element');
  document.body.appendChild(pageBlock);
};
