// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { EdgelessEditor, createEmptyDoc } from '@blocksuite/presets';
import '@blocksuite/presets/themes/affine.css';

const container = document.createElement('div');
container.style.display = 'flex';
container.style.height = '100%';
container.style.width = '100%';
document.body.append(container);

const doc1 = createEmptyDoc().init();
const editor1 = new EdgelessEditor();
editor1.doc = doc1;
editor1.style.flex = '1';
editor1.style.borderRight = '1px solid #ccc';
container.append(editor1);

const doc2 = createEmptyDoc().init();
const editor2 = new EdgelessEditor();
editor2.doc = doc2;
editor2.style.flex = '1';
editor2.style.borderLeft = '1px solid #ccc';
container.append(editor2);
