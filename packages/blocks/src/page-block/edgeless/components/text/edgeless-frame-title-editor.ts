import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import {
  type FrameElement,
  getFontString,
  getLineHeight,
  getLineWidth,
} from '@blocksuite/phasor';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { VirgoInput } from '../../../../components/virgo-input/virgo-input.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-frame-title-editor')
export class EdgelessFrameTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  @query('.virgo-container')
  private _virgoContainer!: HTMLDivElement;

  private _vInput: VirgoInput | null = null;
  get vEditor() {
    assertExists(this._vInput);
    return this._vInput.vEditor;
  }

  private _frame: FrameElement | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;

  mount(frame: FrameElement, edgeless: EdgelessPageBlockComponent) {
    this._frame = frame;
    this._edgeless = edgeless;

    this._vInput = new VirgoInput({
      yText: this._frame.title,
    });

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._vInput);
      assertExists(this._frame);
      this._vInput.mount(this._virgoContainer);
      this._edgeless?.surface.updateElementLocalRecord(this._frame.id, {
        titleHide: true,
      });
      const dispatcher = this._edgeless?.dispatcher;
      assertExists(dispatcher);
      this.disposables.addFromEvent(this._virgoContainer, 'blur', () => {
        this._unmount();
      });
      this.disposables.add(
        dispatcher.add('click', () => {
          return true;
        })
      );
      this.disposables.add(
        dispatcher.add('doubleClick', () => {
          return true;
        })
      );
      this.disposables.add(
        dispatcher.add('keyDown', ctx => {
          const state = ctx.get('keyboardState');
          if (state.raw.key === 'Enter') {
            this._unmount();
            return true;
          }
          requestAnimationFrame(() => {
            this.requestUpdate();
          });
          return false;
        })
      );
      this._disposables.add(
        edgeless.slots.viewportUpdated.on(() => {
          this.requestUpdate();
        })
      );
    });
  }

  private _unmount() {
    this._vInput?.unmount();
    this._disposables.dispose();
    assertExists(this._frame);
    this._edgeless?.surface.updateElementLocalRecord(this._frame.id, {
      titleHide: false,
    });
    this.remove();
    assertExists(this._edgeless);
    this._edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
    this._frame = null;
  }

  override render() {
    const viewport = this._edgeless?.surface.viewport;
    let virgoStyle = styleMap({});
    if (viewport && this._frame && this._edgeless) {
      const padding = this._frame.padding;
      const zoom = viewport.zoom;
      const bound = this._frame.gridBound;
      const fontSize = 16;
      const fontFamily = 'sans-serif';
      const lineHeight = getLineHeight(fontFamily, fontSize);
      const font = getFontString({
        fontSize,
        fontFamily,
        lineHeight: lineHeight + 'px',
      });
      const width =
        getLineWidth(this._frame.title.toJSON(), font) +
        padding[0] * 2 * zoom +
        2;
      const radius = this._frame.radius;
      const [x, y] = viewport.toViewCoord(bound.x, bound.y);
      virgoStyle = styleMap({
        position: 'absolute',
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        minWidth: '8px',
        borderRadius: radius + 'px',
        fontSize: '16px',
        fontFamily: 'sans-serif',
        color: 'white',
        background: this._frame.color,
        outline: 'none',
        padding: `${padding[1] * zoom}px ${padding[0] * zoom}px`,
        lineHeight: 'initial',
        zIndex: '1',
      });
    }
    return html`<div style=${virgoStyle} class="virgo-container"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
