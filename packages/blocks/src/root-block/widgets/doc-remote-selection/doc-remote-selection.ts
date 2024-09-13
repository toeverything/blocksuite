import type { UserInfo } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';
import {
  type BaseSelection,
  BlockSelection,
  TextSelection,
} from '@blocksuite/block-std';
import { WidgetComponent } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { DocRemoteSelectionConfig } from './config.js';

import { RemoteColorManager } from '../../../root-block/remote-color-manager/remote-color-manager.js';
import { cursorStyle, filterCoveringRects, selectionStyle } from './utils.js';

export interface SelectionRect {
  width: number;
  height: number;
  top: number;
  left: number;
  transparent?: boolean;
}

export const AFFINE_DOC_REMOTE_SELECTION_WIDGET =
  'affine-doc-remote-selection-widget';

export class AffineDocRemoteSelectionWidget extends WidgetComponent {
  // avoid being unable to select text by mouse click or drag
  static override styles = css`
    :host {
      pointer-events: none;
    }
  `;

  private _abortController = new AbortController();

  private _remoteColorManager: RemoteColorManager | null = null;

  private _remoteSelections = computed(() => {
    const status = this.doc.awarenessStore.getStates();
    return [...this.std.selection.remoteSelections.entries()].map(
      ([id, selections]) => {
        return {
          id,
          selections,
          user: status.get(id)?.user,
        };
      }
    );
  });

  private _resizeObserver: ResizeObserver = new ResizeObserver(() => {
    this.requestUpdate();
  });

  private get _config(): DocRemoteSelectionConfig {
    const config =
      this.std.getConfig('affine:page')?.docRemoteSelectionWidget ?? {};

    return {
      blockSelectionBackgroundTransparent: block => {
        return (
          matchFlavours(block, [
            'affine:code',
            'affine:database',
            'affine:image',
            'affine:attachment',
            'affine:bookmark',
            'affine:surface-ref',
          ]) || /affine:embed-*/.test(block.flavour)
        );
      },
      ...config,
    };
  }

  private get _container() {
    return this.offsetParent;
  }

  private get _containerRect() {
    return this.offsetParent?.getBoundingClientRect();
  }

  private get _selectionManager() {
    return this.host.selection;
  }

  private _getCursorRect(selections: BaseSelection[]): SelectionRect | null {
    if (this.block.model.flavour !== 'affine:page') {
      console.error('remote selection widget must be used in page component');
      return null;
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
      const range = this.std.range.textSelectionToRange(
        this._selectionManager.create('text', {
          from: {
            blockId: textSelection.to
              ? textSelection.to.blockId
              : textSelection.from.blockId,
            index: textSelection.to
              ? textSelection.to.index + textSelection.to.length
              : textSelection.from.index + textSelection.from.length,
            length: 0,
          },
          to: null,
        })
      );

      if (!range) {
        return null;
      }

      const container = this._container;
      const containerRect = this._containerRect;
      const rangeRects = Array.from(range.getClientRects());
      if (rangeRects.length > 0) {
        const rect =
          rangeRects.length === 1
            ? rangeRects[0]
            : rangeRects[rangeRects.length - 1];
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

      const block = this.host.view.getBlock(lastBlockSelection.blockId);
      if (block) {
        const rect = block.getBoundingClientRect();

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

  private _getSelectionRect(selections: BaseSelection[]): SelectionRect[] {
    if (this.block.model.flavour !== 'affine:page') {
      console.error('remote selection widget must be used in page component');
      return [];
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
      const range = this.std.range.textSelectionToRange(textSelection);

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
        const block = this.host.view.getBlock(blockSelection.blockId);
        if (block) {
          const rect = block.getBoundingClientRect();

          const transparent = this._config.blockSelectionBackgroundTransparent(
            block.model
          );

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
            transparent,
          };
        }

        return [];
      });
    }

    return [];
  }

  override connectedCallback() {
    super.connectedCallback();

    this.handleEvent('wheel', () => {
      this.requestUpdate();
    });

    this.disposables.addFromEvent(window, 'resize', () => {
      this.requestUpdate();
    });

    this._remoteColorManager = new RemoteColorManager(this.std);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver.disconnect();
    this._abortController.abort();
  }

  override render() {
    if (this._remoteSelections.value.length === 0) {
      return nothing;
    }

    const remoteUsers = new Set<number>();
    const selections: Array<{
      id: number;
      selections: BaseSelection[];
      rects: SelectionRect[];
      user?: UserInfo;
    }> = this._remoteSelections.value.flatMap(({ selections, id, user }) => {
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

    const remoteColorManager = this._remoteColorManager;
    assertExists(remoteColorManager);
    return html`<div>
      ${selections.flatMap(selection => {
        const color = remoteColorManager.get(selection.id);
        if (!color) return;
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
                      display: selection.user ? 'block' : 'none',
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
    [AFFINE_DOC_REMOTE_SELECTION_WIDGET]: AffineDocRemoteSelectionWidget;
  }
}
