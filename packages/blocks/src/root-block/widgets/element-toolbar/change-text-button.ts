import '../../edgeless/components/panel/align-panel.js';
import '../../edgeless/components/panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TextElementModel } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-text-button')
export class EdgelessChangeTextButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
    }

    .change-text-container {
      display: flex;
    }
  `;

  @property({ attribute: false })
  texts: TextElementModel[] = [];

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  get doc() {
    return this.edgeless.doc;
  }

  override render() {
    return html`<div class="change-text-container">
      <edgeless-change-text-menu
        .elements=${this.texts}
        .elementType=${'text'}
        .edgeless=${this.edgeless}
      ></edgeless-change-text-menu>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-text-button': EdgelessChangeTextButton;
  }
}

export function renderChangeTextButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: TextElementModel[]
) {
  if (!elements?.length) return nothing;

  return html`<edgeless-change-text-button
    .texts=${elements}
    .edgeless=${edgeless}
  >
  </edgeless-change-text-button>`;
}
