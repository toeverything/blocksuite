import { pick } from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import type { UserInfo } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { RemoteCursor } from '../../icons/edgeless.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { Selectable } from '../../page-block/edgeless/services/tools-manager.js';
import {
  getSelectedRect,
  isTopLevelBlock,
} from '../../page-block/edgeless/utils/query.js';
import { remoteColorManager } from '../../page-block/remote-color-manager/index.js';

@customElement('affine-edgelss-remote-selection-widget')
export class EdgelessRemoteSelectionWidget extends WidgetElement {
  static override styles = css`
    :host {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(
        calc(var(--affine-edgeless-x)),
        calc(var(--affine-edgeless-y))
      );
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
      padding: 0px 4px;
      border-radius: 4px;
      border: 1px solid var(--affine-pure-black-20);
      box-shadow: 0px 1px 6px 0px rgba(0, 0, 0, 0.16);
      font-size: 12px;
      line-height: 18px;
      color: white;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-left: 22px;
      margin-top: -2px;
    }
  `;

  get edgeless() {
    return this.pageElement as EdgelessPageBlockComponent;
  }

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

  @state()
  private _remoteCursors: Record<
    string,
    {
      x: number;
      y: number;
      user?: UserInfo | undefined;
    }
  > = {};

  get selection() {
    return this.edgeless.selectionManager;
  }

  get surface() {
    return this.edgeless.surface;
  }

  private _updateRemoteRects = () => {
    const { selection } = this;
    const remoteSelection = selection.remoteSelection;
    const remoteRects: EdgelessRemoteSelectionWidget['_remoteRects'] = {};

    Object.entries(remoteSelection).forEach(([clientId, selection]) => {
      if (selection.elements.length === 0) return;

      const elements = selection.elements
        .map(id => this.edgeless.getElementModel(id))
        .filter(element => element) as Selectable[];
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

  private _updateRemoteCursor = () => {
    const remoteCursors: EdgelessRemoteSelectionWidget['_remoteCursors'] = {};
    const status = this.page.awarenessStore.getStates();

    Object.entries(this.selection.remoteCursor).forEach(
      ([clientId, cursorSelection]) => {
        remoteCursors[clientId] = {
          x: cursorSelection.x,
          y: cursorSelection.y,
          user: status.get(parseInt(clientId))?.user,
        };
      }
    );

    this._remoteCursors = remoteCursors;
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
    _disposables.add(page.slots.yBlockUpdated.on(this._updateOnElementChange));

    _disposables.add(
      this.page.awarenessStore.slots.update.on(({ type, id }) => {
        if (type === 'remove') remoteColorManager.delete(id);
      })
    );
    _disposables.add(
      this.selection.slots.remoteUpdated.on(this._updateRemoteRects)
    );
    _disposables.add(
      this.selection.slots.remoteCursorUpdated.on(this._updateRemoteCursor)
    );
    this._updateRemoteRects();
  }

  override render() {
    const { _remoteRects } = this;

    const rects = repeat(
      Object.entries(_remoteRects),
      value => value[0],
      ([id, rect]) =>
        html`<div
          data-client-id=${id}
          class="remote-rect"
          style=${styleMap({
            pointerEvents: 'none',
            width: `calc(var(--affine-zoom) * ${rect.width}px)`,
            height: `calc(var(--affine-zoom) * ${rect.height}px)`,
            borderStyle: rect.borderStyle,
            borderColor: remoteColorManager.get(id),
            transform: `translate(calc(var(--affine-zoom) * ${rect.left}px), calc(var(--affine-zoom) * ${rect.top}px)) rotate(${rect.rotate}deg)`,
          })}
        ></div>`
    );

    const cursors = repeat(
      Object.entries(this._remoteCursors),
      value => value[0],
      ([id, cursor]) => {
        return html`<div
          data-client-id=${id}
          class="remote-cursor"
          style=${styleMap({
            pointerEvents: 'none',
            transform: `translate(calc(var(--affine-zoom) * ${cursor.x}px), calc(var(--affine-zoom) * ${cursor.y}px))`,
            color: remoteColorManager.get(id),
          })}
        >
          ${RemoteCursor}
          <div
            class="remote-username"
            style=${styleMap({
              backgroundColor: remoteColorManager.get(id),
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
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgelss-remote-selection-widget': EdgelessRemoteSelectionWidget;
  }
}
