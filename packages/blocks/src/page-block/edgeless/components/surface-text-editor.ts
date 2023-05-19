import { ShadowlessElement } from '@blocksuite/lit';
import { Bound, type TextElement } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { getSelectedRect } from './utils.js';

@customElement('surface-text-editor')
export class SurfaceTextEditor extends ShadowlessElement {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vEditor: VEditor | null = null;
  private _rect: DOMRect | null = null;

  private _element: TextElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;

  get vEditor() {
    return this._vEditor;
  }

  mount(element: TextElement, edgeless: EdgelessPageBlockComponent) {
    const rect = getSelectedRect([element], edgeless.surface.viewport);
    this._rect = rect;
    this._element = element;
    this._edgeless = edgeless;
    this._vEditor = new VEditor(element.text);

    this._vEditor.slots.updated.on(() => {
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
    });

    edgeless.slots.viewportUpdated.on(() => {
      this._virgoContainer.blur();
    });

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._vEditor);
      this._vEditor.mount(this._virgoContainer);

      this._virgoContainer.addEventListener(
        'blur',
        () => {
          this.remove();
          edgeless.slots.selectionUpdated.emit({
            selected: [],
            active: false,
          });
        },
        {
          once: true,
        }
      );
    });
  }

  override render() {
    let virgoStyle = styleMap({});
    let backgroundStyle = styleMap({});
    if (this._rect && this._element && this._edgeless) {
      virgoStyle = styleMap({
        minWidth: '20px',
        fontSize:
          this._element.fontSize * this._edgeless.surface.viewport.zoom + 'px',
        fontFamily: this._element.fontFamily,
        outline: 'none',
      });
      backgroundStyle = styleMap({
        position: 'absolute',
        left: this._rect.x - 16 + 'px',
        top: this._rect.y - 16 + 'px',
        background: 'var(--affine-background-primary-color)',
        zIndex: '10',
        padding: '16px',
        borderRadius: '4px',
      });
    }

    return html`<div
      data-block-is-edgeless-text="true"
      style=${backgroundStyle}
    >
      <div style=${virgoStyle} class="virgo-container"></div>
    </div>`;
  }
}
