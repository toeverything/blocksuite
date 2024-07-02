import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AffineSchemas } from '@blocksuite/blocks';
import { Schema, Doc, DocCollection } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';

@Injectable({
  providedIn: 'root',
})
export class EditorProviderService {
  private editor: AffineEditorContainer;
  private collection: DocCollection;
  private docUpdatedSubject = new BehaviorSubject<Doc[]>([]);
  docUpdated$ = this.docUpdatedSubject.asObservable();

  constructor() {
    const schema = new Schema().register(AffineSchemas);
    this.collection = new DocCollection({ schema });
    this.collection.meta.initialize();
    const doc = this.collection.createDoc({ id: 'page1' });

    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {});
      doc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = doc.addBlock('affine:note', {}, pageBlockId);
      doc.addBlock('affine:paragraph', {}, noteId);
    });

    this.editor = new AffineEditorContainer();
    this.editor.doc = doc;
    this.editor.slots.docLinkClicked.on(({ docId }) => {
      const target = <Doc>this.collection.getDoc(docId);
      this.editor.doc = target;
    });

    this.collection.slots.docUpdated.on(() => this.updateDocs());
    this.editor.slots.docLinkClicked.on(() => this.updateDocs());
  }

  private updateDocs() {
    const docs = [...this.collection.docs.values()].map(blocks =>
      blocks.getDoc()
    );
    this.docUpdatedSubject.next(docs);
  }

  getEditor() {
    return this.editor;
  }

  getCollection() {
    return this.collection;
  }
}
