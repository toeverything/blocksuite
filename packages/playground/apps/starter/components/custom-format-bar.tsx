import { AffineFormatBarWidget } from '@blocksuite/blocks';
import { createRoot } from 'react-dom/client';

export function registerFormatBarCustomElement() {
  AffineFormatBarWidget.customElements.push(
    (formatBar: AffineFormatBarWidget) => {
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
            const root = formatBar.root;
            const selectionManager = root.selectionManager;
            console.log('selections', selectionManager.value);
          }}
        >
          <div>X</div>
        </div>
      );

      return element;
    }
  );
}
