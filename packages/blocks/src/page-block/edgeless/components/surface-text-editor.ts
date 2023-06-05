import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Bound, type TextElement } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { getSelectedRect } from './utils.js';

@customElement('surface-text-editor')
export class SurfaceTextEditor extends WithDisposable(ShadowlessElement) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vEditor: VEditor | null = null;

  private _element: TextElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;
  private _keeping = false;

  get vEditor() {
    return this._vEditor;
  }

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  private _syncRect() {
    const edgeless = this._edgeless;
    const element = this._element;
    if (edgeless && element) {
      const rect = this._virgoContainer.getBoundingClientRect();
      const vLines = Array.from(
        this._virgoContainer.querySelectorAll('v-line')
      );
      const lineHeight = vLines[0].getBoundingClientRect().height;
      edgeless.surface.updateElement(element.id, {
        xywh: new Bound(
          element.x,
          element.y,
          rect.width / edgeless.surface.viewport.zoom,
          (vLines.length / edgeless.surface.viewport.zoom) * lineHeight
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
          if (this._keeping) return;
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
    const viewport = this._edgeless?.surface.viewport;
    let virgoStyle = styleMap({});
    if (viewport && this._element && this._edgeless) {
      const zoom = viewport.zoom;
      const rect = getSelectedRect(
        [this._element],
        this._edgeless.surface.viewport
      );

      virgoStyle = styleMap({
        position: 'absolute',
        left: rect.x + 'px',
        top: rect.y + 'px',
        fontSize: this._element.fontSize + 'px',
        fontFamily: this._element.fontFamily,
        lineHeight: 'initial',
        outline: 'none',
        transform: `scale(${zoom}, ${zoom})`,
        transformOrigin: 'top left',
        color: isCssVariable(this._element.color)
          ? `var(${this._element.color})`
          : this._element.color,
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
