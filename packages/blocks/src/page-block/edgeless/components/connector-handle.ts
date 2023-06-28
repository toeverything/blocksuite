import type {
  EventName,
  UIEventDispatcher,
  UIEventHandler,
} from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import type { ConnectorElement } from '@blocksuite/phasor/index.js';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-connector-handle')
export class EdgelessConnectorHandle extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  connector!: ConnectorElement;

  private _dispatcher!: UIEventDispatcher;

  override connectedCallback() {
    super.connectedCallback();
    this._dispatcher = this.edgeless.root.uiEventDispatcher;
    this._add('pointerDown', ctx => {
      const event = ctx.get('pointerState');
      console.log(event.type, event.raw.target);
    });
  }

  private _add(name: EventName, fn: UIEventHandler) {
    this._disposables.add(this._dispatcher.add(name, fn));
  }

  override render() {
    const { surface } = this.edgeless;
    const { path, x, y } = this.connector;
    const zoom = surface.viewport.zoom;

    const start = {
      position: 'absolute',
      left: `${(path[0][0] - x) * zoom}px`,
      top: `${(path[0][1] - y) * zoom}px`,
    };
    const end = {
      position: 'absolute',
      left: `${(path[path.length - 1][0] - x) * zoom}px`,
      top: `${(path[path.length - 1][1] - y) * zoom}px`,
    };
    return html`
      <style>
        .line-controller {
          position: absolute;
          width: 9px;
          height: 9px;
          box-sizing: border-box;
          border-radius: 50%;
          border: 2px solid var(--affine-text-emphasis-color);
          background-color: var(--affine-background-primary-color);
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 10;
          pointer-events: all;
          /**
             * Fix: pointerEvent stops firing after a short time.
             * When a gesture is started, the browser intersects the touch-action values of the touched element and its ancestors,
             * up to the one that implements the gesture (in other words, the first containing scrolling element)
             * https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
             */
          touch-action: none;
        }
      </style>
      <div class="line-controller line-start" style=${styleMap(start)}></div>
      <div class="line-controller line-end" style=${styleMap(end)}></div>
    `;
  }
}
// @pointerdown=${(e: PointerEvent) => {
//     e.stopPropagation();
//     capPointerdown(e, edgeless, element, 'end', mode, requestUpdate);
// }}
declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-handle': EdgelessConnectorHandle;
  }
}
