import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { ShapeElement } from '@blocksuite/phasor';
import { Bound } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import * as Y from 'yjs';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedRect } from '../utils.js';

@customElement('edgeless-shape-editor')
export class EdgelessShapeEditor extends WithDisposable(ShadowlessElement) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vEditor: VEditor | null = null;

  private _element: ShapeElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;
  private _keeping = false;

  private _resizeObserver: ResizeObserver | null = null;

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
          rect.width / edgeless.surface.viewport.zoom / 0.8,
          ((vLines.length / edgeless.surface.viewport.zoom) * lineHeight) / 0.8
        ).serialize(),
      });
      edgeless.slots.selectionUpdated.emit({
        selected: [element],
        active: true,
      });
    }
  }

  mount(element: ShapeElement, edgeless: EdgelessPageBlockComponent) {
    if (!element.text) {
      const text = new Y.Text();
      edgeless.surface.updateElement<'shape'>(element.id, {
        text,
      });
      const updatedElement = edgeless.surface.pickById(element.id);
      if (updatedElement instanceof ShapeElement && updatedElement.text) {
        this._element = updatedElement;
      } else {
        throw new Error(
          'Failed to mount shape editor because of no text or element type mismatch.'
        );
      }
    } else {
      this._element = element;
    }
    this._edgeless = edgeless;

    assertExists(this._element);
    assertExists(
      this._element.text,
      'Failed to mount shape editor because of no text.'
    );
    this._vEditor = new VEditor(this._element.text);

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
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.vEditor?.unmount();

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
        padding: `${0.1 * this._element.h}px ${0.1 * this._element.w}px`,
      });
    }

    return html`<div
      style=${virgoStyle}
      data-edgeless-canvas-text-editor="true"
      class="virgo-container"
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-editor': EdgelessShapeEditor;
  }
}
