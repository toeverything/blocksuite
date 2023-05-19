import { FormatQuickBar } from '@blocksuite/blocks';
import { createRoot } from 'react-dom/client';

FormatQuickBar.customElements.push(page => {
  const element = document.createElement('div');

  createRoot(element).render(<div>Hello, world!</div>);

  return element;
});
