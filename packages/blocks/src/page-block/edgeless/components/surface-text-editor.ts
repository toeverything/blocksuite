import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Bound, type TextElement } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { getSelectedRect } from './utils.js';

@customElement('surface-text-editor')
export class SurfaceTextEditor extends WithDisposable(ShadowlessElement) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vEditor: VEditor | null = null;

  private _element: TextElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;

  get vEditor() {
    return this._vEditor;
  }

  private _syncRect() {
    const edgeless = this._edgeless;
    const element = this._element;
    if (edgeless && element) {
      const rect = this._virgoContainer.getBoundingClientRect();
      edgeless.surface.updateElement(element.id, {
        xywh: new Bound(
          element.x,
          element.y,
          rect.width / edgeless.surface.viewport.zoom,
          rect.height / edgeless.surface.viewport.zoom
        ).serialize(),
      });
      edgeless.slots.selectionUpdated.emit({
        selected: [element],
        active: true,
      });
    }
  }

  mount(element: TextElement, edgeless: EdgelessPageBlockComponent) {
    this._element = element;
    this._edgeless = edgeless;
    this._vEditor = new VEditor(element.text);

    this._vEditor.slots.updated.on(() => {
      this._syncRect();
    });

    this._disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        this.requestUpdate();
        requestAnimationFrame(() => {
          this._syncRect();
        });
      })
    );

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._vEditor);
      this._element?.setDisplay(false);
      this._vEditor.mount(this._virgoContainer);

      this._virgoContainer.addEventListener(
        'blur',
        () => {
          this._unmount();
        },
        {
          once: true,
        }
      );
    });
  }

  private _unmount() {
    this.vEditor?.unmount();
    this._element?.setDisplay(true);

    if (this._element?.text.length === 0) {
      this._edgeless?.surface.removeElement(this._element?.id);
    }

    this.remove();
    assertExists(this._edgeless);
    this._edgeless.slots.selectionUpdated.emit({
      selected: [],
      active: false,
    });
  }

  override render() {
    let virgoStyle = styleMap({});
    if (this._element && this._edgeless) {
      const rect = getSelectedRect(
        [this._element],
        this._edgeless.surface.viewport
      );

      virgoStyle = styleMap({
        position: 'absolute',
        left: rect.x + 'px',
        top: rect.y + 'px',
        minWidth: this._element.w < 20 ? 20 : this._element.w + 'px',
        minHeight: this._element.h < 20 ? 20 : this._element.h + 'px',
        fontSize:
          this._element.fontSize * this._edgeless.surface.viewport.zoom + 'px',
        fontFamily: this._element.fontFamily,
        lineHeight: '1.5',
        outline: 'none',
      });
    }

    return html`<div style=${virgoStyle} class="virgo-container"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-text-editor': SurfaceTextEditor;
  }
}
