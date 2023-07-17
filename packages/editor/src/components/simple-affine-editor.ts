import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import type { Page } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import { LitElement } from 'lit';
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
export class SimpleAffineEditor extends LitElement {
  readonly workspace: Workspace;
  readonly page: Page;

  constructor() {
    super();
    this.workspace = new Workspace({ id: 'test' })
      .register(AffineSchemas)
      .register(__unstableSchemas);
    this.page = this.workspace.createPage({ id: 'page0' });
    this.page.waitForLoaded().then(() => {
      const pageBlockId = this.page.addBlock('affine:page');
      const noteId = this.page.addBlock('affine:note', {}, pageBlockId);
      this.page.addBlock('affine:paragraph', {}, noteId);
    });
  }

  override connectedCallback() {
    const editor = new EditorContainer();
    editor.page = this.page;
    this.appendChild(editor);
  }

  override disconnectedCallback() {
    this.removeChild(this.children[0]);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-affine-editor': SimpleAffineEditor;
  }
}
