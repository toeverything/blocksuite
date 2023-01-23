/* eslint-disable @typescript-eslint/no-restricted-imports */
import { SimpleAffineEditor } from '@blocksuite/editor';
import '@blocksuite/editor/src/themes/affine.css';

function main() {
  const editor = new SimpleAffineEditor();
  document.body.appendChild(editor);
}

main();
