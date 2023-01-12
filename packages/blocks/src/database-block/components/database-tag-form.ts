import { customElement } from 'lit/decorators.js';
import { LitElement } from 'lit';

@customElement('affine-block-tag-edit-form')
export class BlockTagEditForm extends LitElement {
  protected render(): unknown {
    return super.render();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-tag-edit-form': BlockTagEditForm;
  }
}
