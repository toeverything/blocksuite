// Test page entry located in playground/examples/workspace/index.html
import './test-app';

import { assertExists } from '@blocksuite/global/utils';

import {
  nextFrame,
  runOnce,
  testSerial,
} from '../../__tests__/test-utils-dom.js';
import { Workspace } from '../workspace.js';
import type { TestApp } from './test-app.js';

async function testBasic() {
  testSerial('can create page', async () => {
    const page = workspace.createPage();
    workspace.setPageMeta(page.id, { title: 'hello' });
    await nextFrame();

    const pageMeta = workspace.meta.pageMetas.pop();
    assertExists(pageMeta);
    return pageMeta.id === `${page.id}` && pageMeta.title === 'hello';
  });

  await runOnce();
}

const workspace = new Workspace({ id: 'test' });
window.workspace = workspace;

const app = document.createElement('test-app') as TestApp;
app.workspace = workspace;
document.body.appendChild(app);

document.getElementById('test-basic')?.addEventListener('click', testBasic);
