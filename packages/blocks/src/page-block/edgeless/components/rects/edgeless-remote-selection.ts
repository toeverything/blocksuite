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

@customElement('edgeless-remote-selection')
export class EdgelessRemoteSelection extends WithDisposable(LitElement) {
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

  private _updateRemoteRects = () => {
    const { zoom, selection, surface, remoteColorMap } = this;
    const remoteSelection = selection.remoteSelection;
    const remoteRects: EdgelessRemoteSelection['_remoteRects'] = {};

    Object.entries(remoteSelection).forEach(([clientId, selection]) => {
      if (selection.elements.length === 0) return;

      const elements = selection.elements
        .map(id => this.edgeless.getElementModel(id))
        .filter(element => element) as Selectable[];
      const rect = getSelectedRect(elements);

      if (rect.width === 0 || rect.height === 0) return;

      const [left, top] = surface.toViewCoord(rect.left, rect.top);
      const [width, height] = [rect.width * zoom, rect.height * zoom];

      if (!remoteColorMap.has(clientId))
        remoteColorMap.set(clientId, randomColor());

      let rotate = 0;
      if (elements.length === 1) {
        const element = elements[0];
        if (!isTopLevelBlock(element)) {
          rotate = element.rotate ?? 0;
        }
      }

      remoteRects[clientId] = {
        width,
        height,
        borderStyle: 'solid',
        left,
        top,
        rotate,
      };
    });

    this._remoteRects = remoteRects;
  };

  private _updateOnElementChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;

    if (this.selection.hasRemote(id)) this._updateRemoteRects();
  };

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, surface, page } = this;

    Object.values(
      pick(surface.slots, ['elementAdded', 'elementRemoved', 'elementUpdated'])
    ).forEach(slot => {
      _disposables.add(slot.on(this._updateOnElementChange));
    });

    _disposables.add(
      this.selection.slots.remoteUpdated.on(this._updateRemoteRects)
    );
    _disposables.add(page.slots.yBlockUpdated.on(this._updateOnElementChange));
    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(this._updateRemoteRects)
    );
    this._updateRemoteRects();
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
    'edgeless-remote-selection': EdgelessRemoteSelection;
  }
}
