import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import * as Y from 'yjs';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import { VirgoInput } from '../../../../components/virgo-input/virgo-input.js';
import {
  Bound,
  SHAPE_TEXT_PADDING,
  ShapeElement,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedRect } from '../../utils/query.js';
import { GET_DEFAULT_LINE_COLOR } from '../panel/color-panel.js';

@customElement('edgeless-shape-text-editor')
export class EdgelessShapeTextEditor extends WithDisposable(ShadowlessElement) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vInput: VirgoInput | null = null;
  get vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  private _element: ShapeElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;
  private _keeping = false;

  private _resizeObserver: ResizeObserver | null = null;

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
      edgeless.selectionManager.setSelection({
        elements: [element.id],
        editing: true,
      });
    }
  }

  mount(element: ShapeElement, edgeless: EdgelessPageBlockComponent) {
    if (!element.text) {
      const text = new Y.Text();
      edgeless.surface.updateElement<'shape'>(element.id, {
        text,
        color: GET_DEFAULT_LINE_COLOR(),
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
    this._vInput = new VirgoInput({
      yText: this._element.text,
    });

    this._vInput.vEditor.slots.updated.on(() => {
      this._updateHeight();
    });

    this.disposables.add(
      edgeless.slots.viewportUpdated.on(() => {
        this.requestUpdate();
        requestAnimationFrame(() => {
          this._updateHeight();
        });
      })
    );

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._element);
      this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
        textDisplay: false,
      });
      assertExists(this._vInput);
      this._vInput.mount(this._virgoContainer);

      const dispatcher = this._edgeless?.dispatcher;
      assertExists(dispatcher);
      this._disposables.addFromEvent(this._virgoContainer, 'blur', () => {
        if (this._keeping) return;
        this._unmount();
      });
      this._disposables.add(
        dispatcher.add('click', () => {
          return true;
        })
      );
      this._disposables.add(
        dispatcher.add('doubleClick', () => {
          return true;
        })
      );
    });
  }

  private _unmount() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this._vInput?.unmount();
    assertExists(this._element);
    this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
      textDisplay: true,
    });

    this.remove();
    assertExists(this._edgeless);
    this._edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
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
