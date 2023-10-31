import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  AutoConnectLeftIcon,
  AutoConnectRightIcon,
} from '../../../../_common/icons/edgeless.js';
import type { NoteBlockModel } from '../../../../models.js';
import { Bound } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { isNoteBlock } from '../../utils/query.js';

@customElement('edgeless-auto-connect-sequence')
export class EdgelessAutoConnectSequence extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .edgeless-auto-connect-sequence {
      font-size: 15px;
      text-align: center;
      height: 24px;
      min-width: 24px;
      padding: 0px 6px;
      width: fit-content;
      border-radius: 25px;
      border: 1px solid #0000001a;
      background: var(--affine-primary-color);
      color: var(--affine-white);
      cursor: pointer;
      user-select: none;
    }

    .navigator {
      width: 48px;
      padding: 4px;
      border-radius: 58px;
      border: 1px solid rgba(227, 226, 228, 1);
      transition: opacity 0.5s ease-in-out;
      background: rgba(251, 251, 252, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      opacity: 0;
    }

    .navigator div {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .navigator span {
      display: inline-block;
      height: 8px;
      border: 1px solid rgba(227, 226, 228, 1);
    }

    .navigator div:hover {
      background: var(--affine-hover-color);
    }

    .navigator.show {
      opacity: 1;
    }
  `;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  show = false;

  @property({ attribute: false })
  notes: NoteBlockModel[] = [];

  @state()
  private _index = -1;

  protected override firstUpdated(): void {
    const { _disposables, surface } = this;
    const { edgeless } = surface;
    _disposables.add(
      surface.viewport.slots.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    _disposables.add(
      surface.page.slots.blockUpdated.on(({ type, id }) => {
        if (type === 'update' && isNoteBlock(surface.pickById(id))) {
          this.requestUpdate();
        }
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(() => {
        const { elements } = edgeless.selectionManager;
        if (!(elements.length === 1 && isNoteBlock(elements[0]))) {
          this._index = -1;
        }
      })
    );

    requestAnimationFrame(() => {
      if (surface.edgeless.dispatcher) {
        this._disposables.add(
          surface.edgeless.dispatcher.add('click', ctx => {
            const event = ctx.get('pointerState');
            const { raw } = event;
            const target = raw.target as HTMLElement;
            if (!target) return false;
            if (target.closest('.edgeless-auto-connect-sequence')) {
              const ele = target.closest(
                '.edgeless-auto-connect-sequence'
              ) as Element;
              const index = Number(ele.getAttribute('index'));
              this._index = index === this._index ? -1 : index;
              return true;
            } else if (target.closest('.edgeless-auto-connect-next-button')) {
              this._next();
              return true;
            } else if (
              target.closest('.edgeless-auto-connect-previous-button')
            ) {
              this._previous();
              return true;
            }
            return false;
          })
        );
      }
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.position = 'absolute';
    this.style.top = '0';
    this.style.left = '0';
    this.style.zIndex = '1';
  }

  private _next() {
    const { notes } = this;
    if (this._index >= notes.length - 1) return;
    this._index = this._index + 1;
    const note = notes[this._index];
    const bound = Bound.deserialize(note.xywh);
    this.surface.edgeless.selectionManager.setSelection({
      elements: [note.id],
      editing: false,
    });
    this.surface.viewport.setViewportByBound(bound, [80, 80, 80, 80], true);
  }

  private _previous() {
    const { notes } = this;
    if (this._index <= 0) return;
    this._index = this._index - 1;
    const note = notes[this._index];
    const bound = Bound.deserialize(note.xywh);
    this.surface.edgeless.selectionManager.setSelection({
      elements: [note.id],
      editing: false,
    });
    this.surface.viewport.setViewportByBound(bound, [80, 80, 80, 80], true);
  }

  private _navigator(notes: NoteBlockModel[]) {
    const { viewport } = this.surface;
    const { zoom } = viewport;
    const classname = `navigator ${this._index >= 0 ? 'show' : 'hidden'}`;
    const note = notes[this._index];
    const bound = Bound.deserialize(note.xywh);
    const [left, right] = viewport.toViewCoord(bound.x, bound.y);
    const [width, height] = [bound.w * zoom, bound.h * zoom];
    const navigatorStyle = styleMap({
      position: 'absolute',
      transform: `translate(${left + width / 2 - 26}px, ${
        right + height + 16
      }px)`,
    });
    return html`<div class=${classname} style=${navigatorStyle}>
      <div class="edgeless-auto-connect-previous-button">
        ${AutoConnectLeftIcon}
      </div>
      <span></span>
      <div class="edgeless-auto-connect-next-button">
        ${AutoConnectRightIcon}
      </div>
    </div> `;
  }

  protected override render() {
    if (!this.show) return nothing;

    const { viewport } = this.surface;
    const { zoom } = viewport;
    const { notes } = this;

    return html`${repeat(
      notes,
      note => note.id,
      (note, index) => {
        const bound = Bound.deserialize(note.xywh);
        const [left, right] = viewport.toViewCoord(bound.x, bound.y);
        const [width, height] = [bound.w * zoom, bound.h * zoom];
        const style = styleMap({
          position: 'absolute',
          transform: `translate(${left + width / 2 - 26 / 2}px, ${
            right + height - 14
          }px)`,
        });
        return html`
          <div
            index=${index}
            class="edgeless-auto-connect-sequence"
            style=${style}
          >
            ${index + 1}
          </div>
        `;
      }
    )}
    ${this._index >= 0 && this._index < notes.length
      ? this._navigator(notes)
      : nothing} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-connect-sequence': EdgelessAutoConnectSequence;
  }
}
