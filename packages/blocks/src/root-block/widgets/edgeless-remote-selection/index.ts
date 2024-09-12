import type { RootBlockModel } from '@blocksuite/affine-model';
import type { UserInfo } from '@blocksuite/store';

import { RemoteCursor } from '@blocksuite/affine-components/icons';
import { requestThrottledConnectedFrame } from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { assertExists, pickValues } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../../root-block/edgeless/edgeless-root-block.js';

import {
  getSelectedRect,
  isTopLevelBlock,
} from '../../../root-block/edgeless/utils/query.js';
import { RemoteColorManager } from '../../../root-block/remote-color-manager/remote-color-manager.js';

export const AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET =
  'affine-edgeless-remote-selection-widget';

export class EdgelessRemoteSelectionWidget extends WidgetComponent<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    :host {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      transform-origin: left top;
      contain: size layout;
      z-index: 1;
    }

    .remote-rect {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 4px;
      box-sizing: border-box;
      border-width: 3px;
      z-index: 1;
      transform-origin: center center;
    }

    .remote-cursor {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 50%;
      z-index: 1;
    }

    .remote-cursor > svg {
      display: block;
    }

    .remote-username {
      margin-left: 22px;
      margin-top: -2px;

      color: white;

      max-width: 160px;
      padding: 0px 3px;
      border: 1px solid var(--affine-pure-black-20);

      box-shadow: 0px 1px 6px 0px rgba(0, 0, 0, 0.16);
      border-radius: 4px;

      font-size: 12px;
      line-height: 18px;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  private _remoteColorManager: RemoteColorManager | null = null;

  private _updateOnElementChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;

    if (this.isConnected && this.selection.hasRemote(id))
      this._updateRemoteRects();
  };

  private _updateRemoteCursor = () => {
    const remoteCursors: EdgelessRemoteSelectionWidget['_remoteCursors'] =
      new Map();
    const status = this.doc.awarenessStore.getStates();

    this.selection.remoteCursorSelectionMap.forEach(
      (cursorSelection, clientId) => {
        remoteCursors.set(clientId, {
          x: cursorSelection.x,
          y: cursorSelection.y,
          user: status.get(clientId)?.user,
        });
      }
    );

    this._remoteCursors = remoteCursors;
  };

  private _updateRemoteRects = () => {
    const { selection, block } = this;
    const remoteSelectionsMap = selection.remoteSurfaceSelectionsMap;
    const remoteRects: EdgelessRemoteSelectionWidget['_remoteRects'] =
      new Map();

    remoteSelectionsMap.forEach((selections, clientId) => {
      selections.forEach(selection => {
        if (selection.elements.length === 0) return;

        const elements = selection.elements
          .map(id => block.service.getElementById(id))
          .filter(element => element) as BlockSuite.EdgelessModel[];
        const rect = getSelectedRect(elements);

        if (rect.width === 0 || rect.height === 0) return;

        const { left, top } = rect;
        const [width, height] = [rect.width, rect.height];

        let rotate = 0;
        if (elements.length === 1) {
          const element = elements[0];
          if (!isTopLevelBlock(element)) {
            rotate = element.rotate ?? 0;
          }
        }

        remoteRects.set(clientId, {
          width,
          height,
          borderStyle: 'solid',
          left,
          top,
          rotate,
        });
      });
    });

    this._remoteRects = remoteRects;
  };

  private _updateTransform = requestThrottledConnectedFrame(() => {
    const { translateX, translateY } = this.edgeless.service.viewport;

    this.style.setProperty(
      'transform',
      `translate(${translateX}px, ${translateY}px)`
    );

    this.requestUpdate();
  }, this);

  get edgeless() {
    return this.block;
  }

  get selection() {
    return this.edgeless.service.selection;
  }

  get surface() {
    return this.edgeless.surface;
  }

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, doc, edgeless } = this;

    pickValues(edgeless.service.surface, [
      'elementAdded',
      'elementRemoved',
      'elementUpdated',
    ]).forEach(slot => {
      _disposables.add(slot.on(this._updateOnElementChange));
    });

    _disposables.add(doc.slots.blockUpdated.on(this._updateOnElementChange));

    _disposables.add(
      this.selection.slots.remoteUpdated.on(this._updateRemoteRects)
    );
    _disposables.add(
      this.selection.slots.remoteCursorUpdated.on(this._updateRemoteCursor)
    );

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this._updateTransform();
      })
    );

    this._updateTransform();
    this._updateRemoteRects();

    this._remoteColorManager = new RemoteColorManager(this.std);
  }

  override render() {
    const { _remoteRects, _remoteCursors, _remoteColorManager } = this;
    assertExists(_remoteColorManager);
    const { zoom } = this.edgeless.service.viewport;

    const rects = repeat(
      _remoteRects.entries(),
      value => value[0],
      ([id, rect]) =>
        html`<div
          data-client-id=${id}
          class="remote-rect"
          style=${styleMap({
            pointerEvents: 'none',
            width: `${zoom * rect.width}px`,
            height: `${zoom * rect.height}px`,
            borderStyle: rect.borderStyle,
            borderColor: _remoteColorManager.get(id),
            transform: `translate(${zoom * rect.left}px, ${
              zoom * rect.top
            }px) rotate(${rect.rotate}deg)`,
          })}
        ></div>`
    );

    const cursors = repeat(
      _remoteCursors.entries(),
      value => value[0],
      ([id, cursor]) => {
        return html`<div
          data-client-id=${id}
          class="remote-cursor"
          style=${styleMap({
            pointerEvents: 'none',
            transform: `translate(${zoom * cursor.x}px, ${zoom * cursor.y}px)`,
            color: _remoteColorManager.get(id),
          })}
        >
          ${RemoteCursor}
          <div
            class="remote-username"
            style=${styleMap({
              backgroundColor: _remoteColorManager.get(id),
            })}
          >
            ${cursor.user?.name ?? 'Unknown'}
          </div>
        </div>`;
      }
    );

    return html`
      <div class="affine-edgeless-remote-selection">${rects}${cursors}</div>
    `;
  }

  @state()
  private accessor _remoteCursors: Map<
    number,
    {
      x: number;
      y: number;
      user?: UserInfo | undefined;
    }
  > = new Map();

  @state()
  private accessor _remoteRects: Map<
    number,
    {
      width: number;
      height: number;
      borderStyle: string;
      left: number;
      top: number;
      rotate: number;
    }
  > = new Map();
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET]: EdgelessRemoteSelectionWidget;
  }
}
