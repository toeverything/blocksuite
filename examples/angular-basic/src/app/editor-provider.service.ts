import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AffineSchemas } from '@blocksuite/blocks';
import { Schema, Doc, Workspace } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';

@Injectable({
  providedIn: 'root',
})
export class EditorProviderService {
  private editor: AffineEditorContainer;
  private workspace: Workspace;
  private docUpdatedSubject = new BehaviorSubject<Doc[]>([]);
  docUpdated$ = this.docUpdatedSubject.asObservable();

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

    this.workspace.slots.docUpdated.on(() => this.updateDocs());
    this.editor.slots.docLinkClicked.on(() => this.updateDocs());
  }

  private updateDocs() {
    const docs = [...this.workspace.docs.values()];
    this.docUpdatedSubject.next(docs);
  }

  getEditor() {
    return this.editor;
  }

  getWorkspace() {
    return this.workspace;
  }
}
