import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { EditorProviderService } from '../editor-provider.service';
import { Doc } from '@blocksuite/store';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements AfterViewInit {
  docs: Doc[] = [];

  constructor(public editorProvider: EditorProviderService) {}

  ngAfterViewInit() {
    const workspace = this.editorProvider.getWorkspace();
    this.docs = [...workspace.docs.values()];
  }

  selectDoc(doc: Doc) {
    const editor = this.editorProvider.getEditor();
    editor.doc = doc;
  }
}
