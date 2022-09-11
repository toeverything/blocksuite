import { PageBlock } from '@building-blocks/blocks';
import { noop } from './utils';

window.onload = () => {
  // TextBlock should be used to avoid being tree-shaked
  noop(PageBlock);

  const pageBlock = document.createElement('page-block');
  document.body.appendChild(pageBlock);
};
