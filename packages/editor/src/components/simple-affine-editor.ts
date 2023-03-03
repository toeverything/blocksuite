import { NonShadowLitElement } from '@blocksuite/blocks';
import { builtInSchemas } from '@blocksuite/blocks/models';
import { BaseBlockModel, Page, Text, Workspace } from '@blocksuite/store';
import { customElement } from 'lit/decorators.js';

import { EditorContainer } from './editor-container.js';

/**
 * This is the editor component to be used out-of-the-box.
 * It always starts with an empty local page state,
 * so it doesn't enable the opt-in collaboration and data persistence features.
 * But it's already self-contained and sufficient for embedded use in regular web applications.
 * You can use `editor.importMarkdown` to load markdown content.
 */
@customElement('simple-affine-editor')
export class SimpleAffineEditor extends NonShadowLitElement {
  readonly workspace: Workspace;
  page!: Page;

  constructor() {
    super();

    this.workspace = new Workspace({}).register(builtInSchemas);
    this._subscribePage();

    this.workspace.createPage('page0');
  }

  // Subscribe for page update and create editor after page loaded.
  private _subscribePage() {
    const { workspace } = this;
    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as Page;
      this.page = page;

      const editor = new EditorContainer();
      editor.page = page;
      this.appendChild(editor);

      const pageBlockId = page.addBlockByFlavour('affine:page', {
        title: new Text(),
      });
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageBlockId);
      page.addBlockByFlavour('affine:paragraph', {}, frameId);
    });
  }

  setTitle(title: Text) {
    this.page.updateBlock(this.page.root as BaseBlockModel, { title });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-affine-editor': SimpleAffineEditor;
  }
}
