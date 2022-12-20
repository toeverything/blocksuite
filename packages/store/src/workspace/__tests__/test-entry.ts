// Test page entry located in playground/examples/workspace/index.html
import { Workspace } from '../workspace.js';
import type { TestApp } from './test-app.js';
import {
  testSerial,
  runOnce,
  nextFrame,
} from '../../__tests__/test-utils-dom.js';
import { assertExists } from '../../utils/utils.js';
import './test-app';

let i = 0;

async function testBasic() {
  testSerial('can create page', async () => {
    i++;
    const id = `${i}`;
    workspace.createPage(id);
    workspace.setPageMeta(id, { title: 'hello' });
    await nextFrame();

    const pageMeta = workspace.meta.pageMetas.pop();
    assertExists(pageMeta);
    return pageMeta.id === `${i}` && pageMeta.title === 'hello';
  });

  await runOnce();
}

const workspace = new Workspace({});
window.workspace = workspace;

const app = document.createElement('test-app') as TestApp;
app.workspace = workspace;
document.body.appendChild(app);

document.getElementById('test-basic')?.addEventListener('click', testBasic);
