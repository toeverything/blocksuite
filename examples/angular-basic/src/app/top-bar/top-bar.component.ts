import { Component } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `
    <div class="top-bar">
      <button disabled>Export</button>
      <button disabled>Import</button>
    </div>
  `,
  styles: [
    `
      .top-bar {
        /* Your CSS styles */
      }
    `,
  ],
})
export class TopBarComponent {}
