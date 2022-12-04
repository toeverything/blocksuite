// Test page entry located in playground/examples/workspace/index.html
import { Workspace } from '../workspace';
import type { TestApp } from './test-app';
import { testSerial, runOnce, nextFrame } from '../../__tests__/test-utils-dom';
import './test-app';
import { assertExists } from '../../utils/utils';

let i = 0;

async function testBasic() {
  testSerial('can create workspace', async () => {
    i++;
    workspace.createPage(`${i}`, 'hello');
    await nextFrame();

    const page = workspace.meta.pages.pop();
    assertExists(page);
    return page.id === `${i}` && page.title === 'hello';
  });

  await runOnce();
}

const workspace = new Workspace({});
const app = document.createElement('test-app') as TestApp;
app.workspace = workspace;
document.body.appendChild(app);
window.workspace = workspace;

document.getElementById('test-basic')?.addEventListener('click', testBasic);
