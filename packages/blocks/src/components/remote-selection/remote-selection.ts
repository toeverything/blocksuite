import {
  assertExists,
  BaseBlockModel,
  Page,
  StackItem,
  UserInfo,
  UserRange,
} from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { blockRangeToNativeRange } from '../../__internal__/utils/block-range.js';
import { resetNativeSelection } from '../../__internal__/utils/selection.js';

interface SelectionRect {
  width: number;
  height: number;
  top: number;
  left: number;
}

function addAlpha(hexColor: string, opacity: number): string {
  const normalized = Math.round(Math.min(Math.max(opacity, 0), 1) * 255);
  return hexColor + normalized.toString(16).toUpperCase();
}

function randomColor(): string {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex}`;
}

function selectionStyle(rect: SelectionRect, color: string) {
  return styleMap({
    position: 'absolute',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    backgroundColor: color,
  });
}

function cursorStyle(rect: SelectionRect, color: string) {
  return styleMap({
    position: 'absolute',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    backgroundColor: color,
  });
}

@customElement('remote-selection')
export class RemoteSelection extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      pointer-events: none;
      left: 0;
      top: 0;
    }
  `;

  @property()
  page: Page | null = null;

  private _ranges: Array<{
    id: number;
    userRange: UserRange;
    user?: UserInfo;
  }> = [];

  private _colorMap = new Map<number, string>();

  private _resizeObserver: ResizeObserver = new ResizeObserver(() => {
    this.requestUpdate();
  });

  private _abortController = new AbortController();

  protected firstUpdated() {
    assertExists(this.page);
    this.page.awarenessStore.signals.update.subscribe(
      msg => msg,
      msg => {
        if (!msg || !msg.state?.rangeMap) {
          return;
        }

        if (msg.id === this.page?.awarenessStore.awareness.clientID) {
          return;
        }

        assertExists(this.page);
        const page = this.page;
        const { user, rangeMap } = msg.state;

        if (msg.type === 'update') {
          const index = this._ranges.findIndex(range => range.id === msg.id);
          if (index === -1) {
            this._ranges.push({
              id: msg.id,
              userRange: rangeMap[page.prefixedId],
              user,
            });
          } else {
            this._ranges[index] = {
              id: msg.id,
              userRange: rangeMap[page.prefixedId],
              user,
            };
          }
        } else if (msg.type === 'add') {
          this._ranges.push({
            id: msg.id,
            userRange: rangeMap[page.prefixedId],
            user,
          });
        } else if (msg.type === 'remove') {
          const index = this._ranges.findIndex(range => range.id === msg.id);
          this._ranges.splice(index, 1);
        }

        this.requestUpdate();
      }
    );

    this.page.history.on(
      'stack-item-popped',
      (event: { stackItem: StackItem }) => {
        const userRange = event.stackItem.meta.get('cursor-location');
        if (!userRange) {
          return;
        }

        assertExists(this.page);
        const models = userRange.blockIds
          .map(id => {
            assertExists(this.page);
            return this.page.getBlockById(id);
          })
          .filter(Boolean) as BaseBlockModel[];
        requestAnimationFrame(() => {
          const nativeRange = blockRangeToNativeRange({
            type: 'Native',
            startOffset: userRange.startOffset,
            endOffset: userRange.endOffset,
            models,
          });
          resetNativeSelection(nativeRange);
        });
      }
    );

    this._resizeObserver.observe(document.body);

    const defaultViewportElement = document.querySelector(
      '.affine-default-viewport'
    );
    defaultViewportElement?.addEventListener(
      'scroll',
      () => {
        this.requestUpdate();
      },
      {
        signal: this._abortController.signal,
      }
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver.disconnect();
    this._abortController.abort();
  }

  private _getSelectionRect(userRange: UserRange): SelectionRect[] {
    assertExists(this.page);
    const models = userRange.blockIds
      .map(id => {
        assertExists(this.page);
        return this.page.getBlockById(id);
      })
      .filter(Boolean) as BaseBlockModel[];

    const nativeRange = blockRangeToNativeRange({
      type: 'Native',
      startOffset: userRange.startOffset,
      endOffset: userRange.endOffset,
      models,
    });
    if (!nativeRange) {
      return [];
    }

    const nativeRects = Array.from(nativeRange.getClientRects());
    return nativeRects
      .map(rect => ({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      }))
      .filter(
        rect =>
          (rect.width > 1 && rect.height > 0) || userRange.blockIds.length === 1
      );
  }

  private _getCursorRect(userRange: UserRange): SelectionRect | null {
    assertExists(this.page);
    const endBlockId = userRange.blockIds[userRange.blockIds.length - 1];
    const endOffset = userRange.endOffset;
    const endModel = this.page.getBlockById(endBlockId);
    if (!endModel || !endModel.text) {
      return null;
    }

    const nativeRange = blockRangeToNativeRange({
      type: 'Native',
      startOffset: endOffset,
      endOffset: endOffset,
      models: [endModel],
    });
    if (!nativeRange) {
      return null;
    }

    const nativeRects = Array.from(nativeRange.getClientRects());
    if (nativeRects.length === 1) {
      const rect = nativeRects[0];
      return {
        width: 2,
        height: rect.height + 4,
        top: rect.top - 2,
        left: rect.left,
      };
    }

    return null;
  }

  render() {
    if (!this.page || this._ranges.length === 0) {
      this._colorMap.clear();
      return html``;
    }

    const selections: Array<{
      id: number;
      userRange: UserRange;
      rects: SelectionRect[];
      user?: UserInfo;
    }> = this._ranges.map(range => ({
      id: range.id,
      userRange: range.userRange,
      rects: this._getSelectionRect(range.userRange),
      user: range.user,
    }));

    return html`<div>
      ${selections.flatMap(selection => {
        if (selection.user) {
          this._colorMap.set(selection.id, selection.user.color);
        }
        if (!this._colorMap.has(selection.id)) {
          this._colorMap.set(selection.id, randomColor());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const color = this._colorMap.get(selection.id)!;
        const cursorRect = this._getCursorRect(selection.userRange);

        return selection.rects
          .map(
            r => html`
              <div style="${selectionStyle(r, addAlpha(color, 0.5))}"></div>
            `
          )
          .concat([
            html`
              <div
                style="${cursorRect
                  ? cursorStyle(cursorRect, color)
                  : styleMap({
                      display: 'none',
                    })}"
              >
                <div
                  style="${styleMap({
                    position: 'relative',
                    height: '100%',
                  })}"
                >
                  <div
                    style="${styleMap({
                      position: 'absolute',
                      bottom: `${cursorRect?.height}px`,
                      padding: '2px',
                      'background-color': color,
                      color: 'white',
                    })}"
                  >
                    ${selection.user?.name}
                  </div>
                </div>
              </div>
            `,
          ]);
      })}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'remote-selection': RemoteSelection;
  }
}
