import { blockRangeToNativeRange } from '@blocksuite/blocks/std.js';
import { assertExists, Page, UserInfo, UserRange } from '@blocksuite/store';
import { faker } from '@faker-js/faker';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

interface SelectionRect {
  width: number;
  height: number;
  top: number;
  left: number;
}

function selectionPositionStyle(rect: SelectionRect, color: string) {
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
  private _selections: Array<{
    rects: SelectionRect[];
    user?: UserInfo;
  }> = [];

  protected firstUpdated() {
    assertExists(this.page);
    this.page.awarenessStore.signals.update.subscribe(
      msg => msg,
      msg => {
        if (
          !msg ||
          !msg.state?.rangeMap ||
          msg.id === this.page?.awarenessStore.awareness.clientID
        ) {
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
  }

  private _getSelectionRect(range: UserRange): SelectionRect[] {
    assertExists(this.page);
    const startModel = this.page.getBlockById(range.startBlockId);
    const endModel = this.page.getBlockById(range.endBlockId);
    if (!startModel || !endModel || !startModel.text || !endModel.text) {
      return [];
    }

    const nativeRange = blockRangeToNativeRange({
      startModel,
      startOffset: range.startOffset,
      endModel,
      endOffset: range.endOffset,
      betweenModels: [],
    });
    const roughRect = nativeRange.getBoundingClientRect();
    return Array.from(nativeRange.getClientRects())
      .map(rect => ({
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      }))
      .filter(
        rect =>
          rect.width > 0 &&
          rect.height > 0 &&
          rect.width < roughRect.width &&
          rect.height < roughRect.height
      );
  }

  render() {
    if (!this.page) {
      return html``;
    }

    console.log(this._ranges);
    this._selections = this._ranges.map(range => ({
      rects: this._getSelectionRect(range.userRange),
      user: range.user,
    }));
    return html`<div>
      ${this._selections.flatMap(selection => {
        const color = faker.color.rgb({ format: 'css', includeAlpha: true });
        return selection.rects.map(
          r => html`<div style="${selectionPositionStyle(r, color)}"></div>`
        );
      })}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'remote-selection': RemoteSelection;
  }
}
