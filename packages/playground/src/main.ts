import { PaperContainer } from '@building-blocks/editor';
import { noop } from './utils';

window.onload = () => {
  // avoid being tree-shaked
  noop(PaperContainer);

  const container = document.createElement('paper-container');
  document.body.appendChild(container);
};
