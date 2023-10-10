import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { matchFlavours } from '../../../../__internal__/index.js';
import { HiddenIcon } from '../../../../icons/index.js';
import { type NoteBlockModel } from '../../../../note-block/note-model.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-note-status')
export class EdgelessNoteStatus extends WithDisposable(LitElement) {
  static STATUS_VERTICAL_OFFSET = -32;

  static override styles = css`
    :host {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
    }

    .status-label {
      position: absolute;
      left: 0;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 10px;
      width: 24px;
      height: 24px;
      background: var(--affine-blue-600);
      color: var(--affine-white);
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      line-height: 16px;
      transform-origin: top left;
    }

    .status-label > .text {
      display: flex;
      padding: 4px 6px;
      flex-direction: column;
    }

    .status-label > .text.hidden {
      display: flex;
      padding: 4px;
      flex-direction: unset;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  _updateViewportId: number | null = null;

  get selection() {
    return this.edgeless.selectionManager;
  }

  get page() {
    return this.edgeless.page;
  }

  get notes() {
    return this.edgeless.notes;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.selection.slots.updated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.page.slots.yBlockUpdated.on(({ id }) => {
        const note = this.page.getBlockById(id) as NoteBlockModel;

        if (!note || matchFlavours(note, ['affine:note'])) {
          this.requestUpdate();
        }
      })
    );

    this._disposables.add(
      this.edgeless.surface.viewport.slots.viewportUpdated.on(() => {
        this.updateViewport();
      })
    );
  }

  updateViewport() {
    if (this._updateViewportId) return;

    this._updateViewportId = requestAnimationFrame(() => {
      const { translateX, translateY, zoom } = this.edgeless.surface.viewport;

      this.style.setProperty(
        'transform',
        `translate(${translateX}px, ${translateY}px)`
      );
      this.style.setProperty('--affine-edgeless-zoom', `${zoom}`);
      this._updateViewportId = null;
    });
  }

  override render() {
    const { selection, notes } = this;
    const firstSelectedElement = selection.elements[0];

    if (
      selection.state.elements.length !== 1 ||
      !firstSelectedElement ||
      !matchFlavours(firstSelectedElement as BaseBlockModel, ['affine:note'])
    )
      return nothing;

    const currentSelected = selection.state.elements[0];
    let idx = 0;

    return html`<div class="edgeless-note-status">
      ${repeat(
        notes,
        note => note.id,
        note => {
          if (!note.hidden) idx++;
          if (currentSelected == note.id) return nothing;

          const [x, y] = note.xywh;

          return html`<div
            data-note-id=${note.id}
            class="status-label"
            style=${styleMap({
              transform: `translate(calc(${x}px * var(--affine-edgeless-zoom)), calc(${y}px * var(--affine-edgeless-zoom) + ${EdgelessNoteStatus.STATUS_VERTICAL_OFFSET}px))`,
            })}
          >
            ${note.hidden
              ? html`<span class="text hidden">${HiddenIcon}</span>`
              : html`<span class="text">${idx}</span>`}
          </div>`;
        }
      )}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-note-status': EdgelessNoteStatus;
  }
}
