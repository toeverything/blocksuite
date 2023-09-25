import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getBlockElementById } from '../../../../__internal__/index.js';
import { VirgoInput } from '../../../../components/virgo-input/virgo-input.js';
import type {
  FrameBlockComponent,
  FrameBlockModel,
} from '../../../../frame-block/index.js';
import { Bound } from '../../../../surface-block/index.js';
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

  private _frame: FrameBlockModel | null = null;
  private _block: FrameBlockComponent | null = null;
  private _edgeless: EdgelessPageBlockComponent | null = null;

  mount(frame: FrameBlockModel, edgeless: EdgelessPageBlockComponent) {
    this._frame = frame;
    this._block = getBlockElementById(
      this._frame.id,
      edgeless
    ) as FrameBlockComponent;
    this._block.titleHide = true;
    this._edgeless = edgeless;

    this._vInput = new VirgoInput({
      yText: this._frame.title.yText,
    });

    this.requestUpdate();
    requestAnimationFrame(() => {
      assertExists(this._vInput);
      assertExists(this._frame);
      this._vInput.mount(this._virgoContainer);
      this._vInput.vEditor.selectAll();
      const dispatcher = this._edgeless?.dispatcher;
      assertExists(dispatcher);
      this.disposables.addFromEvent(this._virgoContainer, 'blur', () => {
        this._unmount();
      });

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
    this._block && (this._block.titleHide = false);
    this._vInput?.unmount();
    this._disposables.dispose();
    assertExists(this._frame);
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
      if (!this._block) {
        console.warn('block not found');
        return nothing;
      }
      const bound = Bound.deserialize(this._frame.xywh);

      const [x, y] = viewport.toViewCoord(bound.x, bound.y);
      virgoStyle = styleMap({
        transformOrigin: 'top left',
        borderRadius: '35px',
        width: 'fit-content',
        padding: '4px 10px',
        fontSize: '14px',
        position: 'absolute',

        left: x + 'px',
        top: y - 38 + 'px',
        minWidth: '8px',
        fontFamily: 'sans-serif',
        color: 'white',
        background: this._block.color,
        outline: 'none',
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
