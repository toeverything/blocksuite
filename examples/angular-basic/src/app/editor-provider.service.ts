import { Injectable } from '@angular/core';
import { Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import { Schema, Doc } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';

@Injectable({
  providedIn: 'root',
})
export class EditorProviderService {
  private editor: AffineEditorContainer;
  private workspace: Workspace;

  constructor() {
    const schema = new Schema().register(AffineSchemas);
    this.workspace = new Workspace({ schema });
    const doc = this.workspace.createDoc({ id: 'page1' });

    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {});
      doc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = doc.addBlock('affine:note', {}, pageBlockId);
      doc.addBlock('affine:paragraph', {}, noteId);
    });

    this.editor = new AffineEditorContainer();
    this.editor.doc = doc;
    this.editor.slots.docLinkClicked.on(({ docId }) => {
      const target = <Doc>this.workspace.getDoc(docId);
      this.editor.doc = target;
    });
  }

  getEditor() {
    return this.editor;
  }

  getWorkspace() {
    return this.workspace;
  }
}
