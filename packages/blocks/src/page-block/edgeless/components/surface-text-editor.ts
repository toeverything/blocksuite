import { ShadowlessElement } from '@blocksuite/lit';
import type { TextElement } from '@blocksuite/phasor';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

@customElement('surface-text-editor')
export class SurfaceTextEditor extends ShadowlessElement {
  textElement: TextElement | null = null;

  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vEditor: VEditor | null = null;

  mount(element: TextElement) {
    this.textElement = element;
    this._vEditor = new VEditor(element.text);
    this._vEditor.mount(this._virgoContainer);
  }

  unmount() {
    this.textElement = null;
    this._vEditor?.unmount();
    this._vEditor = null;
  }

  override render() {
    return html`<div class="virgo-container"></div>`;
  }
}
