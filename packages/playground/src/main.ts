import { PaperContainer } from '@building-blocks/framework';
import { noop } from './utils';

window.onload = () => {
  // avoid being tree-shaked
  noop(PaperContainer);

  const container = document.createElement('paper-container');
  document.body.appendChild(container);
};
