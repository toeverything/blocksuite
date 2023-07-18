import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { SHAPE_TEXT_PADDING, ShapeElement } from '@blocksuite/phasor';
import { Bound } from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import * as Y from 'yjs';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-shape-text-editor')
export class EdgelessShapeTextEditor extends WithDisposable(ShadowlessElement) {
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

  private _updateHeight() {
    const edgeless = this._edgeless;
    const element = this._element;
    if (edgeless && element) {
      const containerHeight =
        this._virgoContainer.getBoundingClientRect().height /
        edgeless.surface.viewport.zoom;
      if (containerHeight > element.h) {
        edgeless.surface.updateElement<'shape'>(element.id, {
          xywh: new Bound(
            element.x,
            element.y,
            element.w,
            containerHeight
          ).serialize(),
        });
        this._virgoContainer.style.minHeight = `${containerHeight}px`;
      }
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
      this._updateHeight();
    });

    this._disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        this.requestUpdate();
        requestAnimationFrame(() => {
          this._updateHeight();
        });
      })
    );

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._vEditor);
      assertExists(this._element);
      this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
        textDisplay: false,
      });
      this._vEditor.mount(this._virgoContainer);

      const dispacher = this._edgeless?.dispacher;
      assertExists(dispacher);
      this._disposables.addFromEvent(this._virgoContainer, 'blur', () => {
        if (this._keeping) return;
        this._unmount();
      });
      this._disposables.add(
        dispacher.add('click', () => {
          return true;
        })
      );
      this._disposables.add(
        dispacher.add('doubleClick', () => {
          return true;
        })
      );
    });
  }

  private _unmount() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.vEditor?.unmount();
    assertExists(this._element);
    this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
      textDisplay: true,
    });

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
        left: x + 'px',
        top: y + 'px',
        width: rect.width + 'px',
        minHeight: rect.height + 'px',
        fontSize: this._element.fontSize + 'px',
        fontFamily: this._element.fontFamily,
        lineHeight: 'initial',
        outline: 'none',
        transform: `scale(${zoom}, ${zoom})`,
        transformOrigin: 'top left',
        color: isCssVariable(this._element.color)
          ? `var(${this._element.color})`
          : this._element.color,
        padding: SHAPE_TEXT_PADDING + 'px',
        textAlign: this._element.textAlign,
        display: 'grid',
        gridTemplateColumns: '100%',
        alignItems:
          this._element.textVerticalAlign === 'center'
            ? 'center'
            : this._element.textVerticalAlign === 'bottom'
            ? 'end'
            : 'start',
        alignContent: 'center',
        gap: '0',
        zIndex: '1',
      });
    }

    return html`<div style=${virgoStyle} class="virgo-container"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-text-editor': EdgelessShapeTextEditor;
  }
}
