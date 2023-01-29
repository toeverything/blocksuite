import { SimpleAffineEditor } from '@blocksuite/editor';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

// @ts-ignore
import * as bench from '/bench.js';
bench.start();
const editor = new SimpleAffineEditor();
document.body.append(editor);
bench.stop();
