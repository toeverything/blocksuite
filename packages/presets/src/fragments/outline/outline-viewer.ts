import { WithDisposable } from '@blocksuite/block-std';
import { NoteDisplayMode } from '@blocksuite/blocks';
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
      --timing: cubic-bezier(0.6, 0.1, 0.41, 1.2);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: flex-end;
      transition:
        all 0.4s var(--timing),
        max-height 0.1s ease 0.3s;
      padding: 10px 5px;
      border-radius: 8px;
      border: 1px solid transparent;
      max-height: 100vh;
      overflow-y: auto;
    }

    .outline-viewer-indicator {
      flex-shrink: 0;
      width: 20px;
      height: 2px;
      overflow: hidden;
      background: rgba(100, 100, 100, 0.2);
      transition:
        all 0.4s var(--timing),
        background 0.8s var(--timing);
      border-radius: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .outline-viewer-content {
      transition: all 0.4s var(--timing);
      width: 180px;
      height: 30px;
      opacity: 0;
    }
    .outline-viewer-indicator.active {
      width: 24px;
      background: var(--affine-text-primary-color);
    }
    .outline-viewer-root:hover {
      gap: 4px;
      padding: 10px;
      background: white;
      border-color: var(--affine-border-color);
      max-height: 400px;
      transition:
        all 0.4s var(--timing),
        max-height 0.1s ease;
    }
    .outline-viewer-root:hover .outline-viewer-indicator {
      background: transparent;
      width: 180px;
      height: 30px;
      transition:
        all 0.4s var(--timing),
        background 0.2s var(--timing);
    }
    .outline-viewer-root:hover .outline-viewer-content {
      opacity: 1;
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

    const headingBlocks = getHeadingBlocksFromDoc(
      this.editor.doc,
      [NoteDisplayMode.DocAndEdgeless, NoteDisplayMode.DocOnly],
      true
    );

    return html`<div class="outline-viewer-root">
      ${repeat(
        headingBlocks,
        block => block.id,
        block => {
          return html`<div
            class="outline-viewer-indicator ${this._activeHeadingId$.value ===
            block.id
              ? 'active'
              : ''}"
          >
            <div class="outline-viewer-content">
              <affine-outline-block-preview .block=${block}>
              </affine-outline-block-preview>
            </div>
          </div>`;
        }
      )}
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
