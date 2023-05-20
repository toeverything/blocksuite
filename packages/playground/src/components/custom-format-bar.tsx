import { FormatQuickBar } from '@blocksuite/blocks';
import { createRoot } from 'react-dom/client';

export function registerFormatBarCustomElement() {
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
        data-testid="custom-format-bar-element"
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
}
