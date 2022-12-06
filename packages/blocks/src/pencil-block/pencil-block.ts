import { customElement } from 'lit/decorators';
import { LitElement } from 'lit';

@customElement('pencil-block')
export class PencilBlockComponent extends LitElement {}

declare global {
  interface HTMLElementTagNameMap {
    'pencil-block': PencilBlockComponent;
  }
}
