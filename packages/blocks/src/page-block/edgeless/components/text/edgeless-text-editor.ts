import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { Bound, type TextElement } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-text-editor')
export class EdgelessTextEditor extends WithDisposable(ShadowlessElement) {
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
      this._element &&
        this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
          display: false,
        });
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
    this._element &&
      this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
        display: true,
      });

    if (this._element?.text.length === 0) {
      this._edgeless?.connector.detachConnectors([this._element]);
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
      const rect = getSelectedRect([this._element]);
      const [x, y] = this._edgeless.surface.toViewCoord(rect.left, rect.top);

      virgoStyle = styleMap({
        position: 'absolute',
        minWidth: '2px',
        left: `${x}px`,
        top: `${y}px`,
        fontSize: `${this._element.fontSize}px`,
        fontFamily: this._element.fontFamily,
        lineHeight: 'initial',
        outline: 'none',
        transform: `scale(${zoom}, ${zoom})`,
        transformOrigin: 'top left',
        color: isCssVariable(this._element.color)
          ? `var(${this._element.color})`
          : this._element.color,
        zIndex: '10',
      });
    }

    return html`<div style=${virgoStyle} class="virgo-container"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-text-editor': EdgelessTextEditor;
  }
}
