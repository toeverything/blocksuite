import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isNoteBlock } from '../../utils/query.js';

@customElement('edgeless-hover-rect')
export class EdgelessHoverRect extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout;
    }

    .affine-edgeless-hover-rect {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border: var(--affine-border-width) solid var(--affine-blue);
      visibility: hidden;
      transform-origin: top left;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @query('.affine-edgeless-hover-rect')
  rect!: HTMLDivElement;

  rAfId: number | null = null;

  private _refreshHoverRect = () => {
    if (this.rAfId) cancelAnimationFrame(this.rAfId);

    const hoverState = this.edgeless.tools.getHoverState();

    if (!hoverState) {
      this.rAfId = requestAnimationFrame(() => {
        this.rect.style.removeProperty('visibility');
      });

      return;
    }
    const { zoom } = this.edgeless.surface.viewport;
    const { rect } = hoverState;
    const element = hoverState.content;
    const isNote = isNoteBlock(element);

    this.rAfId = requestAnimationFrame(() => {
      this.rect.style.visibility = 'visible';
      this.rect.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
      this.rect.style.width = `${rect.width}px`;
      this.rect.style.height = `${rect.height}px`;
      this.rect.style.borderRadius = isNote
        ? `${element.edgeless.style.borderRadius * zoom}px`
        : '';
      this.rect.style.backgroundColor = isNote
        ? 'var(--affine-hover-color)'
        : '';
      this.rAfId = null;
    });
  };

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.slots.hoverUpdated.on(() => this._refreshHoverRect())
    );
    this._disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => this._refreshHoverRect())
    );
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() =>
        this._refreshHoverRect()
      )
    );
  }

  protected override render() {
    return html` <div class="affine-edgeless-hover-rect"></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-hover-rect': EdgelessHoverRect;
  }
}
