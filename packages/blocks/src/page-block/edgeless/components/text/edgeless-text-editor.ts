import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../../../../__internal__/theme/css-variables.js';
import { VirgoInput } from '../../../../components/virgo-input/virgo-input.js';
import { Bound, type TextElement } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { deleteElements } from '../../utils/crud.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-text-editor')
export class EdgelessTextEditor extends WithDisposable(ShadowlessElement) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vInput: VirgoInput | null = null;
  get vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  private _element: TextElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;
  private _keeping = false;

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
    }
  }

  mount(element: TextElement, edgeless: EdgelessPageBlockComponent) {
    this._element = element;
    this._edgeless = edgeless;
    this._vInput = new VirgoInput({
      yText: this._element.text,
    });

    this._vInput.vEditor.slots.updated.on(() => {
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
      assertExists(this._vInput);
      assertExists(this._element);
      this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
        display: false,
      });
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
    this._vInput?.unmount();
    assertExists(this._element);
    assertExists(this._edgeless);
    this._edgeless?.surface.updateElementLocalRecord(this._element.id, {
      display: true,
    });

    if (this._element?.text.length === 0) {
      deleteElements(this._edgeless, [this._element]);
    }

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
        textAlign: this._element.textAlign,
        marginRight: '-100%',
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
