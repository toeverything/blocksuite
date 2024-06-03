import '../../edgeless/components/panel/align-panel.js';
import '../../edgeless/components/panel/font-family-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-change-edgeless-text-button')
export class EdgelessChangeEdgelessTextButton extends WithDisposable(
  LitElement
) {
  @property({ attribute: false })
  accessor texts: EdgelessTextBlockModel[] = [];

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  get doc() {
    return this.edgeless.doc;
  }

  override render() {
    return html`
      <edgeless-change-text-menu
        .elements=${this.texts}
        .elementType=${'edgeless-text'}
        .edgeless=${this.edgeless}
      ></edgeless-change-text-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-edgeless-text-button': EdgelessChangeEdgelessTextButton;
  }
}

export function renderChangeEdgelessTextButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: EdgelessTextBlockModel[]
) {
  if (!elements?.length) return nothing;

  return html`
    <edgeless-change-edgeless-text-button
      .texts=${elements}
      .edgeless=${edgeless}
    >
    </edgeless-change-edgeless-text-button>
  `;
}
