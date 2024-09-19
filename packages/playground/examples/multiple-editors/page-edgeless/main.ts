import {
  createEmptyDoc,
  EdgelessEditor,
  PageEditor,
} from '@blocksuite/presets';

import '../../../style.css';

const container = document.createElement('div');
container.style.display = 'flex';
container.style.height = '100%';
container.style.width = '100%';
document.body.append(container);

const doc1 = createEmptyDoc().init();
const editor1 = new PageEditor();
editor1.doc = doc1;
editor1.style.flex = '2';
editor1.style.borderRight = '1px solid #ccc';
container.append(editor1);

const doc2 = createEmptyDoc().init();
const editor2 = new EdgelessEditor();
editor2.doc = doc2;
editor2.style.flex = '3';
editor2.style.borderLeft = '1px solid #ccc';
container.append(editor2);
