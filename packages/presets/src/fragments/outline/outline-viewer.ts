import { WithDisposable } from '@blocksuite/block-std';
import { NoteDisplayMode, scrollbarStyle } from '@blocksuite/blocks';
import { noop } from '@blocksuite/global/utils';
import { SignalWatcher, signal } from '@lit-labs/preact-signals';
import { LitElement, type PropertyValues, css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AffineEditorContainer } from '../../editors/editor-container.js';

import { TocIcon } from '../_common/icons.js';
import { observeActiveHeading } from './utils/heading-highlight.js';
import { getHeadingBlocksFromDoc } from './utils/query.js';

export const AFFINE_OUTLINE_VIEWER = 'affine-outline-viewer';

@customElement(AFFINE_OUTLINE_VIEWER)
export class OutlineViewer extends SignalWatcher(WithDisposable(LitElement)) {
  private _activeHeadingId$ = signal<string | null>(null);

  static override styles = css`
    :host {
      display: flex;
    }

    .outline-viewer-root {
      position: relative;
      display: flex;
    }

    .outline-heading-indicator-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
      gap: 16px;
      min-height: 16px;
      max-height: 100%;
      overflow: hidden;
      position: absolute;
      right: 0;
    }

    .outline-heading-indicator-container.hidden {
      position: relative;
      position: flex;
      visibility: hidden;
    }

    .outline-heading-indicator {
      width: 20px;
      height: 2px;
      flex-shrink: 0;

      border-radius: 1px;
      background: var(--affine-black-10, rgba(0, 0, 0, 0.1));
      transition: width 0.3s;
    }

    .outline-heading-indicator[active] {
      width: 24px;
      height: 2px;

      border-radius: 1px;
      background: var(--affine-black-80, rgba(0, 0, 0, 0.8));
    }

    .outline-viewer-container {
      width: 0px;
      padding: 8px 0px;
      max-height: 100%;
      box-sizing: border-box;
      display: flex;
      overflow-x: hidden;
      background: var(--affine-background-overlay-panel-color, #fbfbfc);
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
      border-radius: var(--8, 8px);
      z-index: var(--affine-z-index-popover);

      transition: width 0.3s;
    }

    .outline-viewer-container.show {
      width: 200px;
      border: 0.5px solid var(--affine-border-color, #e3e2e4);
    }

    .outline-viewer-inner-container {
      display: flex;
      box-sizing: border-box;
      width: 200px;
      flex-direction: column;
      align-items: flex-start;
      overflow-y: auto;
    }

    ${scrollbarStyle('.outline-viewer-inner-container')}

    .outline-viewer-header-container {
      display: flex;
      padding: 0px 10px 0px 14px;
      align-items: center;
      gap: 4px;
      align-self: stretch;
    }

    .outline-viewer-header-label {
      flex: 1;
      overflow: hidden;
      color: var(--affine-text-secondary-color, #8e8d91);
      text-overflow: ellipsis;
      text-wrap: nowrap;

      font-family: Inter;
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
    }

    .outline-viewer-body {
      flex-grow: 1;
      width: 100%;
    }
  `;

  private _renderIndicators() {
    const headingBlocks = getHeadingBlocksFromDoc(
      this.editor.doc,
      [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
      true
    );

    return html`<div
      class=${classMap({
        'outline-heading-indicator-container': true,
        hidden: this._showViewer,
      })}
    >
      ${repeat(
        headingBlocks,
        block => block.id,
        ({ id }) =>
          html`<div
            class="outline-heading-indicator"
            ?active=${this._activeHeadingId$.value === id}
          ></div>`
      )}
    </div>`;
  }

  private _renderViewer() {
    if (!this.editor) return nothing;

    return html` <div
      class=${classMap({
        'outline-viewer-container': true,
        show: this._showViewer,
      })}
    >
      <div class="outline-viewer-inner-container">
        <div class="outline-viewer-header-container">
          <span class="outline-viewer-header-label">Table of Contents</span>
          <edgeless-tool-icon-button
            .tooltip=${'Open in sidebar'}
            .tipPosition=${'top-end'}
            .activeMode=${'background'}
            @click=${this._toggleOutlinePanel}
          >
            ${TocIcon}
          </edgeless-tool-icon-button>
        </div>
        <affine-outline-panel-body
          class="outline-viewer-body"
          .doc=${this.editor.doc}
          .fitPadding=${[0, 0, 0, 0]}
          .edgeless=${null}
          .editorHost=${this.editor.host}
          .mode=${'page'}
          .activeHeadingId=${this._activeHeadingId$}
          .renderEdgelessOnlyNotes=${false}
          .showPreviewIcon=${false}
          .enableNotesSorting=${false}
          .toggleNotesSorting=${noop}
          .noticeVisible=${false}
          .setNoticeVisibility=${noop}
        >
        </affine-outline-panel-body>
      </div>
    </div>`;
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
      observeActiveHeading(() => this.editor.host, this._activeHeadingId$)
    );
  }

  override render() {
    if (!this.editor || this.editor.mode === 'edgeless') return nothing;

    return html`<div
      class="outline-viewer-root"
      @mouseenter=${() => {
        this._showViewer = true;
      }}
      @mouseleave=${() => {
        this._showViewer = false;
      }}
    >
      ${this._renderIndicators()}${this._renderViewer()}
    </div>`;
  }

  override updated(_changedProperties: PropertyValues<this>) {
    if (this._activeIndicator) {
      this._activeIndicator.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });
    }
  }

  @query('.outline-heading-indicator[active]')
  private accessor _activeIndicator: HTMLElement | null = null;

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
