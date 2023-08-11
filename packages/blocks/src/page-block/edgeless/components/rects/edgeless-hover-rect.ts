import { WithDisposable } from '@blocksuite/lit';
import { matchFlavours } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isTopLevelBlock } from '../../utils/query.js';

@customElement('edgeless-hover-rect')
export class EdgelessHoverRect extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      pointer-events: none;
    }
    .affine-edgeless-hover-rect {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 0;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 1;
      border: var(--affine-border-width) solid var(--affine-blue);
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.slots.hoverUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => this.requestUpdate())
    );
    this._disposables.add(
      this.edgeless.selection.slots.updated.on(() => this.requestUpdate())
    );
  }

  protected override render() {
    const { edgeless } = this;
    const hoverState = edgeless.tools.getHoverState();
    if (!hoverState || edgeless.selection.state.editing) return nothing;
    const rect = hoverState.rect;
    const isNote =
      isTopLevelBlock(hoverState.content) &&
      matchFlavours(hoverState.content, ['affine:note']);

    const style = {
      left: rect.x + 'px',
      top: rect.y + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      backgroundColor: isNote ? 'var(--affine-hover-color)' : '',
    };

    return html`
      <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-hover-rect': EdgelessHoverRect;
  }
}
