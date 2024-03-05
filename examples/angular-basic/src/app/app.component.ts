import { Component, ViewEncapsulation } from '@angular/core';
import { EditorProviderService } from './editor-provider.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { EditorContainerComponent } from './editor-container/editor-container.component';
import '@blocksuite/presets/themes/affine.css';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, TopBarComponent, EditorContainerComponent],
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  constructor(public editorProvider: EditorProviderService) {}
}
