import { NonShadowLitElement } from '@blocksuite/blocks';
import { builtInSchemas } from '@blocksuite/blocks/models';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { customElement, query } from 'lit/decorators.js';

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

  @query('editor-container')
  private _editorContainer!: EditorContainer;

  constructor() {
    super();

    this.workspace = new Workspace({ id: 'test' }).register(builtInSchemas);
    this._subscribePage();

    this.workspace.createPage('page0');
  }

  // Subscribe for page update and create editor after page loaded.
  private _subscribePage() {
    const { workspace } = this;
    workspace.slots.pageAdded.once(pageId => {
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

  importMarkdown(content: string) {
    const root = this.page.root as BaseBlockModel;
    const { _editorContainer } = this;
    _editorContainer.clipboard.importMarkdown(content, root.id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-affine-editor': SimpleAffineEditor;
  }
}
