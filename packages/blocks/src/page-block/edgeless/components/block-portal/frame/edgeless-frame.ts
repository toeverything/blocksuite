import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { FrameBlockModel } from '../../../../../frame-block/index.js';
import { EdgelessBlockType } from '../../../../../surface-block/edgeless-types.js';
import { Bound } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

const { FRAME } = EdgelessBlockType;

@customElement('edgeless-block-portal-frame')
class EdgelessBlockPortalFrame extends EdgelessPortalBase<FrameBlockModel> {
  override render() {
    const { model, index } = this;
    const { xywh } = model;
    const bound = Bound.deserialize(xywh);
    const style = styleMap({
      position: 'absolute',
      zIndex: `${index}`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
    });

    return html` <div style=${style}>${this.renderModel(model)}</div> `;
  }
}

@customElement('edgeless-frames-container')
export class EdgelessFramesContainer extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frames!: FrameBlockModel[];

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.position = 'absolute';
    this.style.zIndex = '0';
  }

  protected override firstUpdated() {
    const { _disposables, surface } = this;

    _disposables.add(
      surface.page.slots.blockUpdated.on(({ flavour }) => {
        if (flavour === FRAME) {
          this.requestUpdate();
        }
      })
    );
  }

  protected override render() {
    return html`
      ${repeat(
        this.frames,
        frame => frame.id,
        (frame, index) =>
          html`<edgeless-block-portal-frame
            .index=${index}
            .model=${frame}
            .surface=${this.surface}
            .edgeless=${this.edgeless}
          >
          </edgeless-block-portal-frame> `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frames-container': EdgelessFramesContainer;
    'edgeless-block-portal-frame': EdgelessBlockPortalFrame;
  }
}
