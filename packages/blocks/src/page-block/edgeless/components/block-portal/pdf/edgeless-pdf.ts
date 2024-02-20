import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { PDFBlockModel } from '../../../../../pdf-block/pdf-model.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-block-portal-pdf')
export class EdgelessBlockPortalPDF extends EdgelessPortalBase<PDFBlockModel> {
  @state()
  active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(
      this.edgeless.service.selection.slots.updated.on(() => {
        this.active =
          this.edgeless.service.selection.has(this.model.id) &&
          this.edgeless.service.selection.editing;
      })
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
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      transformOrigin: '0px 0px',
      userSelect: this.active ? 'auto' : 'none',
    };

    return html`
      <div class="edgeless-block-portal-pdf" style=${styleMap(style)}>
        ${this.renderModel(model)}
        <edgeless-pdf-mask
          .edgeless=${this.edgeless}
          .model=${model}
          .active=${this.active}
        ></edgeless-pdf-mask>
      </div>
    `;
  }
}

@customElement('edgeless-pdf-mask')
export class EdgelessPDFMask extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .edgeless-pdf-mask {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      z-index: 2;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  model!: PDFBlockModel;

  @property({ attribute: false })
  active = false;

  override render() {
    const style = styleMap({
      display: this.active ? 'none' : 'block',
    });

    return html`<div class="edgeless-pdf-mask" style=${style}></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-pdf': EdgelessBlockPortalPDF;
    'edgeless-pdf-mask': EdgelessPDFMask;
  }
}
