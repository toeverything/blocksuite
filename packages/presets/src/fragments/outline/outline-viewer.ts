import { WithDisposable } from '@blocksuite/block-std';
import { NoteDisplayMode, scrollbarStyle } from '@blocksuite/blocks';
import { SignalWatcher, effect, signal } from '@lit-labs/preact-signals';
import { LitElement, type PropertyValues, css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AffineEditorContainer } from '../../editors/editor-container.js';

import { TocIcon } from '../_common/icons.js';
import { getHeadingBlocksFromDoc } from './utils/query.js';
import {
  observeActiveHeading,
  scrollToBlockWithHighlight,
} from './utils/scroll.js';

export const AFFINE_OUTLINE_VIEWER = 'affine-outline-viewer';

@customElement(AFFINE_OUTLINE_VIEWER)
export class OutlineViewer extends SignalWatcher(WithDisposable(LitElement)) {
  private _activeHeadingId$ = signal<string | null>(null);

  private _clearHighlightMask = () => {};

  private _lockIndicatorsScroll = false;

  private _scrollIndicator = () => {
    if (this._lockIndicatorsScroll) return;
    if (!this._root) return;

    if (!this._activeIndicator) {
      this._root.scrollTop = 0;
      return;
    }

    const { top, bottom } = this._activeIndicator.getBoundingClientRect();
    const { top: rootTop, bottom: rootBottom } =
      this._root.getBoundingClientRect();

    if (top < rootTop) {
      this._root.scrollTop -= rootTop - top + 5;
    } else if (bottom > rootBottom) {
      this._root.scrollTop += bottom - rootBottom + 5;
    }
  };

  private _unlockIndicatorsScrollTimeout: ReturnType<typeof setTimeout> | null =
    null;

  private static animationDuration = 400;

  static override styles = css`
    :host {
      display: flex;
    }

    .outline-viewer-root {
      --timing: cubic-bezier(0.2, 1.2, 0.41, 1);
      --duration: ${OutlineViewer.animationDuration}ms;

      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 16px;
      max-height: 100%;
      box-sizing: border-box;
      border: 1px solid transparent;
      overflow-y: hidden;

      transition: all var(--duration) var(--timing);
    }

    .outline-viewer-indicator {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 2px;
      border-radius: 1px;
      overflow: hidden;
      background: var(--affine-black-10, rgba(0, 0, 0, 0.1));
      transition:
        all var(--duration) var(--timing),
        background 0.8s var(--timing);
    }

    .outline-viewer-content {
      display: flex;
      transition: all var(--duration) var(--timing);
      width: 184px;
      opacity: 0;
    }

    .outline-viewer-indicator.header {
      background-color: transparent;
    }

    .outline-viewer-indicator.header {
      .outline-viewer-content {
        gap: 4px;
        padding: 6px 8px;

        span {
          flex: 1;
          overflow: hidden;
          color: var(--affine-text-secondary-color, #8e8d91);
          text-overflow: ellipsis;
          text-wrap: nowrap;

          font-family: var(--affine-font-family);
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 20px;
        }
      }
    }

    .outline-viewer-indicator.active {
      width: 24px;
      background: var(--affine-text-primary-color);
    }

    .outline-viewer-root:hover {
      gap: 0px;
      padding: 8px 4px 8px 8px;
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px;
      border-color: var(--affine-border-color);
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
      overflow-y: auto;

      transition:
        all var(--duration) var(--timing),
        max-height 0.1s ease;

      .outline-viewer-indicator {
        background: transparent;
        width: 180px;
        height: 30px;
        transition:
          all var(--duration) var(--timing),
          background 0.2s var(--timing);
      }

      .outline-viewer-content {
        opacity: 1;
      }
    }

    ${scrollbarStyle('.outline-viewer-root:hover')}
  `;

  private async _scrollToBlock(blockId: string) {
    // lock indicators scroll when scrolling to block,
    //  because scroll both will break the block scroll in chrome
    {
      this._lockIndicatorsScroll = true;
      if (this._unlockIndicatorsScrollTimeout) {
        clearTimeout(this._unlockIndicatorsScrollTimeout);
      }
      this._unlockIndicatorsScrollTimeout = setTimeout(() => {
        this._lockIndicatorsScroll = false;
      }, 1000);
    }

    this._clearHighlightMask = await scrollToBlockWithHighlight(
      this.editor,
      blockId
    );
  }

  private _toggleOutlinePanel() {
    if (this.toggleOutlinePanel) {
      this._showViewer = false;
      this.toggleOutlinePanel();
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      observeActiveHeading(() => this.editor, this._activeHeadingId$)
    );

    this.disposables.add(
      effect(() => {
        // A workaround for detect the change of active heading id in updated function
        this._activeHeadingId = this._activeHeadingId$.value;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearHighlightMask();
    if (this._unlockIndicatorsScrollTimeout) {
      clearTimeout(this._unlockIndicatorsScrollTimeout);
    }
  }

  override render() {
    if (
      !this.editor ||
      !this.editor.doc.root ||
      this.editor.mode === 'edgeless'
    )
      return nothing;

    const headingBlocks = getHeadingBlocksFromDoc(
      this.editor.doc,
      [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
      true
    );

    if (headingBlocks.length === 0) return nothing;

    const items = [
      ...(this.editor.doc.meta?.title !== '' ? [this.editor.doc.root] : []),
      ...headingBlocks,
    ];

    // since the content change the height of indicator,
    //  we need to delay the scroll util the height is stable
    const delayScrollIndicators = () => {
      setTimeout(this._scrollIndicator, OutlineViewer.animationDuration);
    };

    return html`<div
      class="outline-viewer-root"
      @mouseenter=${delayScrollIndicators}
      @mouseleave=${delayScrollIndicators}
    >
      <div class="outline-viewer-indicator header">
        <div class="outline-viewer-content">
          <span>Table of Contents</span>
          <edgeless-tool-icon-button
            .tooltip=${'Open in sidebar'}
            .tipPosition=${'top-end'}
            .activeMode=${'background'}
            @click=${this._toggleOutlinePanel}
          >
            ${TocIcon}
          </edgeless-tool-icon-button>
        </div>
      </div>
      ${repeat(
        items,
        block => block.id,
        block => {
          const active = this._activeHeadingId === block.id;
          return html`<div
            class=${classMap({
              'outline-viewer-indicator': true,
              active,
            })}
          >
            <div class="outline-viewer-content">
              <affine-outline-block-preview
                class=${classMap({ active })}
                .block=${block}
                @click=${() => {
                  this._scrollToBlock(block.id).catch(console.error);
                }}
              >
              </affine-outline-block-preview>
            </div>
          </div>`;
        }
      )}
    </div>`;
  }

  override updated(changedProperties: PropertyValues) {
    if (changedProperties.has('_activeHeadingId')) {
      this._scrollIndicator();
    }
  }

  @state()
  private accessor _activeHeadingId: string | null = null;

  @query('.outline-viewer-indicator.active')
  private accessor _activeIndicator: HTMLElement | null = null;

  @query('.outline-viewer-root')
  private accessor _root: HTMLElement | null = null;

  @state()
  private accessor _showViewer: boolean = false;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor toggleOutlinePanel: (() => void) | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_VIEWER]: OutlineViewer;
  }
}
