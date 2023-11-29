import { AffineFormatBarWidget } from '@blocksuite/blocks';

export function extendFormatBar() {
  AffineFormatBarWidget.customElements.add(
    (formatBar: AffineFormatBarWidget) => {
      // If you are using react,
      // you can use `createRoot` to mount the component here.
      const element = document.createElement('div');
      element.textContent = '❤️';
      element.addEventListener('click', () => {
        const root = formatBar.root;
        const selectionManager = root.selection;
        console.log('selections', selectionManager.value);
      });

      return element;
    }
  );
}
