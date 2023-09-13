import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { matchFlavours } from '../../../../__internal__/index.js';
import { HiddenIcon } from '../../../../icons/index.js';
import { type NoteBlockModel } from '../../../../note-block/note-model.js';
import { deserializeXYWH } from '../../../../surface-block/utils/xywh.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-note-status')
export class EdgelessNoteStatus extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
      transform: translate(var(--affine-edgeless-x), var(--affine-edgeless-y))
        scale(var(--affine-zoom));
    }

    .status-label {
      position: absolute;
      top: calc(-32px / var(--affine-zoom));
      left: calc(4px / var(--affine-zoom));
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
  }

  override render() {
    const { selection, notes } = this;

    if (
      selection.state.elements.length !== 1 ||
      !matchFlavours(selection.elements[0] as BaseBlockModel, ['affine:note'])
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

          const [x, y] = deserializeXYWH(note.xywh);

          return html`<div
            data-note-id=${note.id}
            class="status-label"
            style=${styleMap({
              transform: `translate(${x}px, ${y}px) scale(calc(1 / var(--affine-zoom)))`,
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
