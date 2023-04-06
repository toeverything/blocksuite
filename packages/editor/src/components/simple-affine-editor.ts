import { ShadowlessElement } from '@blocksuite/blocks';
import { AffineSchemas } from '@blocksuite/blocks/models';
import type { Page } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
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
export class SimpleAffineEditor extends ShadowlessElement {
  readonly workspace: Workspace;
  readonly page: Page;

  constructor() {
    super();

    this.workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
    this.page = this.workspace.createPage();

    const pageBlockId = this.page.addBlock('affine:page');
    const frameId = this.page.addBlock('affine:frame', {}, pageBlockId);
    this.page.addBlock('affine:paragraph', {}, frameId);
  }

  connectedCallback() {
    const editor = new EditorContainer();
    editor.page = this.page;
    this.appendChild(editor);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-affine-editor': SimpleAffineEditor;
  }
}
