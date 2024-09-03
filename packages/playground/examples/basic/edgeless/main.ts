import { EdgelessEditor, createEmptyDoc } from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';

const doc = createEmptyDoc().init();
const editor = new EdgelessEditor();
editor.doc = doc;
document.body.append(editor);
