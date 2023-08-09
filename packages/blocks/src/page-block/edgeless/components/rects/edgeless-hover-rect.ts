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
    .affine-edgeless-hover-rect {
      position: absolute;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.slots.hoverUpdated.on(() => this.requestUpdate())
    );
  }

  protected override render() {
    const hoverState = this.edgeless.tools.getHoverState();
    if (!hoverState) return nothing;
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
