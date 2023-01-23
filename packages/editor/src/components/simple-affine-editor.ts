import { customElement } from 'lit/decorators.js';
import { NonShadowLitElement } from '@blocksuite/blocks';
import { BlockSchema } from '@blocksuite/blocks/models';
import { Page, Workspace } from '@blocksuite/store';
import { EditorContainer } from './editor-container.js';

// Subscribe for page update and create editor after page loaded.
function subscribePage(parent: HTMLElement, workspace: Workspace) {
  workspace.signals.pageAdded.once(pageId => {
    const page = workspace.getPage(pageId) as Page;

    const editor = new EditorContainer();
    editor.page = page;
    parent.appendChild(editor);

    const pageBlockId = page.addBlockByFlavour('affine:page', { title: '' });
    const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
    page.addBlockByFlavour('affine:paragraph', {}, frameId);

    // @ts-ignore
    // [window.editor, window.page] = [editor, page];
  });
}

@customElement('simple-affine-editor')
export class SimpleAffineEditor extends NonShadowLitElement {
  readonly workspace: Workspace;
  readonly page!: Page;

  constructor() {
    super();

    this.workspace = new Workspace({}).register(BlockSchema);
    subscribePage(this, this.workspace);

    this.workspace.createPage('page0');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-affine-editor': SimpleAffineEditor;
  }
}
