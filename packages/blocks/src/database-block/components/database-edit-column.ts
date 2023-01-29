import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-database-edit-column')
export class DatabaseEditColumn extends LitElement {
  protected render(): unknown {
    return html` <div>Edit Column</div> `;
  }
}
