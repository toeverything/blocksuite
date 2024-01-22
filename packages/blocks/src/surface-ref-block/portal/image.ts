import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';
import { css, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { ImageBlockModel } from '../../image-block/image-model.js';
import { Bound } from '../../surface-block/utils/bound.js';

@customElement('surface-ref-image-portal')
export class SurfaceRefImagePortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    surface-ref-image-portal {
      position: relative;
    }
  `;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: ImageBlockModel;

  @property({ attribute: false })
  renderModel!: (model: BlockModel) => TemplateResult;

  override firstUpdated() {
    this.disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
  }

  override render() {
    const { model, index } = this;
    const bound = Bound.deserialize(model.xywh);
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: `${bound.h}px`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    };

    return html`
      <div
        style=${styleMap(style)}
        data-portal-reference-block-id="${model.id}"
      >
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-image-portal': SurfaceRefImagePortal;
  }
}
