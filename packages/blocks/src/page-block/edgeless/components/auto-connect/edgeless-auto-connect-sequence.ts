import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessBlockType } from '../../../../surface-block/edgeless-types.js';
import { Bound } from '../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { isNoteBlock } from '../../utils/query.js';

const { NOTE } = EdgelessBlockType;

@customElement('edgeless-auto-connect-sequence')
export class EdgelessAutoConnectSequence extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .edgeless-auto-connect-sequence {
      font-size: 15px;
      text-align: center;
      height: 24px;
      min-width: 12px;
      padding: 0px 6px;
      width: fit-content;
      border-radius: 25px;
      border: 1px solid #0000001a;
      background: var(--affine-primary-color);
      color: var(--affine-white);
      cursor: pointer;
    }
  `;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  show = false;

  protected override firstUpdated(): void {
    const { _disposables, surface } = this;

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
  }

  protected override render() {
    if (!this.show) return nothing;

    const { viewport } = this.surface;
    const { zoom } = viewport;
    const notes = this.surface.getblocks(NOTE).filter(note => !note.hidden);

    return repeat(
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
          <div class="edgeless-auto-connect-sequence" style=${style}>
            ${index + 1}
          </div>
        `;
      }
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-connect-sequence': EdgelessAutoConnectSequence;
  }
}
