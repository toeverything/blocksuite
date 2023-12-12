import { AffineFormatBarWidget } from '@blocksuite/blocks';

export function extendFormatBar() {
  AffineFormatBarWidget.customElements.add(
    (formatBar: AffineFormatBarWidget) => {
      // If you are using react,
      // you can use `createRoot` to mount the component here.
      const element = document.createElement('div');
      element.textContent = '❤️';
      element.setAttribute('data-testid', 'custom-format-bar-element');
      element.addEventListener('click', () => {
        const host = formatBar.host;
        const selectionManager = host.selection;
        console.log('selections', selectionManager.value);
      });

      return element;
    }
  );
}
