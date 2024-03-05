import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { EditorProviderService } from '../editor-provider.service';

@Component({
  selector: 'app-editor-container',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `<div #editorContainerRef class="editor-container"></div>`,
})
export class EditorContainerComponent implements AfterViewInit {
  @ViewChild('editorContainerRef', { static: true })
  editorContainerRef!: ElementRef;

  constructor(private editorProvider: EditorProviderService) {}

  ngAfterViewInit() {
    const editor = this.editorProvider.getEditor();
    if (this.editorContainerRef.nativeElement && editor) {
      this.editorContainerRef.nativeElement.appendChild(editor);
    }
  }
}
