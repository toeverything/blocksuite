import { pick } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { Selectable } from '../../services/tools-manager.js';
import { getSelectedRect, isTopLevelBlock } from '../../utils/query.js';

function randomColor(): string {
  const h = Math.floor(Math.random() * 360).toString();
  return `hsl(${h}, 75%, 65%)`;
}

@customElement('edgeless-remote-cursor')
export class EdgelessRemoteCursor extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      pointer-events: none;
    }

    .affine-edgeless-remote-rect {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 4px;
      box-sizing: border-box;
      border-width: 3px;
      z-index: 1;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  remoteColorMap!: Map<string, string>;

  @state()
  private _remoteRects: Record<
    string,
    {
      width: number;
      height: number;
      borderStyle: string;
      left: number;
      top: number;
      rotate: number;
    }
  > = {};

  get selection() {
    return this.edgeless.selectionManager;
  }

  get surface() {
    return this.edgeless.surface;
  }

  get zoom() {
    return this.surface.viewport.zoom;
  }

  get page() {
    return this.edgeless.page;
  }

  private _updateRemoteCursor = () => {};

  override connectedCallback() {
    super.connectedCallback();

    const { edgeless } = this;

    this.selection.slots;
  }

  override render() {
    const { _remoteRects, remoteColorMap } = this;

    return html`<div class="affine-edgeless-remote-selection">
      ${repeat(
        Object.entries(_remoteRects),
        value => value[0],
        ([id, rect]) =>
          html`<div
            data-client-id=${id}
            class="affine-edgeless-remote-rect"
            style=${styleMap({
              pointerEvents: 'none',
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              borderStyle: rect.borderStyle,
              borderColor: `${remoteColorMap.get(id)}`,
              transform: `translate(${rect.left}px, ${rect.top}px) rotate(${rect.rotate}deg)`,
            })}
          ></div>`
      )}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-remote-cursor': EdgelessRemoteCursor;
  }
}
