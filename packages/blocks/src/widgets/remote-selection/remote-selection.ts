import {
  type BaseSelection,
  BlockSelection,
  TextSelection,
} from '@blocksuite/block-std';
import { assertExists, throttle } from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import { type UserInfo } from '@blocksuite/store';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { remoteColorManager } from '../../page-block/remote-color-manager/index.js';
import { isPageComponent } from '../../page-block/utils/guard.js';
import { cursorStyle, filterCoveringRects, selectionStyle } from './utils.js';

export const AFFINE_REMOTE_SELECTION_WIDGET_TAG =
  'affine-remote-selection-widget';

export interface SelectionRect {
  width: number;
  height: number;
  top: number;
  left: number;
}

@customElement(AFFINE_REMOTE_SELECTION_WIDGET_TAG)
export class AffineRemoteSelectionWidget extends WidgetElement {
  private _remoteSelections: Array<{
    id: number;
    selections: BaseSelection[];
    user?: UserInfo;
  }> = [];

  private get _selectionManager() {
    return this.root.selection;
  }

  private get _container() {
    return this.offsetParent;
  }

  private get _containerRect() {
    return this.offsetParent?.getBoundingClientRect();
  }

  private _resizeObserver: ResizeObserver = new ResizeObserver(() => {
    this.requestUpdate();
  });

  private _abortController = new AbortController();

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this._selectionManager.slots.remoteChanged.on(
        throttle((remoteSelections: Record<string, BaseSelection[]>) => {
          const status = this.page.awarenessStore.getStates();
          this._remoteSelections = Object.entries(remoteSelections).map(
            ([id, selections]) => {
              return {
                id: parseInt(id),
                selections,
                user: status.get(parseInt(id))?.user,
              };
            }
          );

          this.requestUpdate();
        }, 100)
      )
    );
    this._disposables.add(
      this.page.awarenessStore.slots.update.on(({ type, id }) => {
        if (type === 'remove') remoteColorManager.delete(id);
      })
    );
    this.handleEvent('wheel', () => {
      this.requestUpdate();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver.disconnect();
    this._abortController.abort();
  }

  private _getSelectionRect(selections: BaseSelection[]): SelectionRect[] {
    if (!isPageComponent(this.pageElement)) {
      throw new Error('remote selection widget must be used in page component');
    }

    const textSelection = selections.find(
      selection => selection instanceof TextSelection
    ) as TextSelection | undefined;
    const blockSelections = selections.filter(
      selection => selection instanceof BlockSelection
    );

    const container = this._container;
    const containerRect = this._containerRect;
    if (textSelection) {
      const rangeManager = this.root.rangeManager;
      assertExists(rangeManager);
      const range = rangeManager.textSelectionToRange(textSelection);

      if (range) {
        const nativeRects = Array.from(range.getClientRects());
        const rectsWithoutFiltered = nativeRects
          .map(rect => ({
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
            top:
              rect.top -
              (containerRect?.top ?? 0) +
              (container?.scrollTop ?? 0),
            left:
              rect.left -
              (containerRect?.left ?? 0) +
              (container?.scrollLeft ?? 0),
          }))
          .filter(rect => rect.width > 0 && rect.height > 0);

        return filterCoveringRects(rectsWithoutFiltered);
      }
    } else if (blockSelections.length > 0) {
      return blockSelections.flatMap(blockSelection => {
        const blockElement = this.root.view.viewFromPath(
          'block',
          blockSelection.path
        );
        if (blockElement) {
          const rect = blockElement.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            top:
              rect.top -
              (containerRect?.top ?? 0) +
              (container?.scrollTop ?? 0),
            left:
              rect.left -
              (containerRect?.left ?? 0) +
              (container?.scrollLeft ?? 0),
          };
        }

        return [];
      });
    }

    return [];
  }

  private _getCursorRect(selections: BaseSelection[]): SelectionRect | null {
    if (!isPageComponent(this.pageElement)) {
      throw new Error('remote selection widget must be used in page component');
    }

    const textSelection = selections.find(
      selection => selection instanceof TextSelection
    ) as TextSelection | undefined;
    const blockSelections = selections.filter(
      selection => selection instanceof BlockSelection
    );
    const container = this._container;
    const containerRect = this._containerRect;

    if (textSelection) {
      const rangeManager = this.root.rangeManager;
      assertExists(rangeManager);
      const range = rangeManager.pointToRange({
        path: textSelection.to
          ? textSelection.to.path
          : textSelection.from.path,
        index: textSelection.to
          ? textSelection.to.index + textSelection.to.length
          : textSelection.from.index + textSelection.from.length,
        length: 0,
      });

      if (!range) {
        return null;
      }

      const container = this._container;
      const containerRect = this._containerRect;
      const rangeRects = Array.from(range.getClientRects());
      if (rangeRects.length === 1) {
        const rect = rangeRects[0];
        return {
          width: 2,
          height: rect.height,
          top:
            rect.top - (containerRect?.top ?? 0) + (container?.scrollTop ?? 0),
          left:
            rect.left -
            (containerRect?.left ?? 0) +
            (container?.scrollLeft ?? 0),
        };
      }
    } else if (blockSelections.length > 0) {
      const lastBlockSelection = blockSelections[blockSelections.length - 1];

      const blockElement = this.root.view.viewFromPath(
        'block',
        lastBlockSelection.path
      );
      if (blockElement) {
        const rect = blockElement.getBoundingClientRect();
        return {
          width: 2,
          height: rect.height,
          top:
            rect.top - (containerRect?.top ?? 0) + (container?.scrollTop ?? 0),
          left:
            rect.left +
            rect.width -
            (containerRect?.left ?? 0) +
            (container?.scrollLeft ?? 0),
        };
      }
    }

    return null;
  }

  override render() {
    if (this._remoteSelections.length === 0) {
      return nothing;
    }

    const remoteUsers = new Set<number>();
    const selections: Array<{
      id: number;
      selections: BaseSelection[];
      rects: SelectionRect[];
      user?: UserInfo;
    }> = this._remoteSelections.flatMap(({ selections, id, user }) => {
      if (remoteUsers.has(id)) {
        return [];
      } else {
        remoteUsers.add(id);
      }

      return {
        id,
        selections,
        rects: this._getSelectionRect(selections),
        user,
      };
    });

    return html`<div>
      ${selections.flatMap(selection => {
        const color = remoteColorManager.get(selection.id) as string;
        const cursorRect = this._getCursorRect(selection.selections);

        return selection.rects
          .map(r => html`<div style="${selectionStyle(r, color)}"></div>`)
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
                      left: '-4px',
                      bottom: `${
                        cursorRect?.height ? cursorRect.height - 4 : 0
                      }px`,
                      backgroundColor: color,
                      color: 'white',
                      maxWidth: '160px',
                      padding: '0 3px',
                      border: '1px solid var(--affine-pure-black-20)',
                      boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.16)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      lineHeight: '18px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    })}"
                  >
                    ${selection.user?.name ?? 'Unknown'}
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
    [AFFINE_REMOTE_SELECTION_WIDGET_TAG]: AffineRemoteSelectionWidget;
  }
}
