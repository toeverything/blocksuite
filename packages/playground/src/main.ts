import { PageBlockElement } from '@building-blocks/blocks';
import { noop } from './utils';

window.onload = () => {
  // avoid being tree-shaked
  noop(PageBlockElement);

  const container = document.createElement('paper-container');
  document.body.appendChild(container);
};
