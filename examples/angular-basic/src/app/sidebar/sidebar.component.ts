import {
  AfterViewInit,
  Component,
  ViewEncapsulation,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { EditorProviderService } from '../editor-provider.service';
import { Doc } from '@blocksuite/store';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  docs: Doc[] = [];
  private subscription = new Subscription();

  constructor(
    public editorProvider: EditorProviderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    const collection = this.editorProvider.getCollection();
    const docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
    this.docs = docs;
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.subscription.add(
      this.editorProvider.docUpdated$.subscribe(docs => {
        this.docs = docs;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  selectDoc(doc: Doc) {
    const editor = this.editorProvider.getEditor();
    editor.doc = doc;
  }
}
