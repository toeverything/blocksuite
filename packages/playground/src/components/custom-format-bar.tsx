import { FormatQuickBar } from '@blocksuite/blocks';
import { createRoot } from 'react-dom/client';

FormatQuickBar.customElements.push((page, getBlockRange) => {
  const element = document.createElement('div');

  createRoot(element).render(
    <div
      style={{
        height: '32px',
        width: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={() => {
        const range = getBlockRange();
        console.log('range', range);
      }}
    >
      <div>X</div>
    </div>
  );

  return element;
});
