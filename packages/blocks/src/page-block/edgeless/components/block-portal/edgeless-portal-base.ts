import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import { requestConnectedFrame } from '../../../../_common/utils/event.js';
import { Bound, type SurfaceBlockComponent } from '../../../../index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

export class EdgelessPortalBase<
  T extends BaseBlockModel,
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: T;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected portalContainer!: HTMLDivElement;

  protected renderModel(model: T) {
    return this.surface.host.renderModel(model);
  }

  protected getViewPositionTransform() {
    const bound = Bound.deserialize(
      (this.model as BaseBlockModel<{ xywh: string }>).xywh
    );
    const { translateX, translateY, zoom } = this.surface.viewport;

    return `translate(${translateX + bound.x * zoom}px, ${
      translateY + bound.y * zoom
    }px) scale(${zoom})`;
  }

  protected viewportUpdated() {
    if (!this.portalContainer) return;

    this.portalContainer.style.setProperty(
      'transform',
      this.getViewPositionTransform()
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();

    let rAqId: number | null = null;
    this._disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        if (rAqId) return;
        rAqId = requestConnectedFrame(() => {
          this.viewportUpdated();
          rAqId = null;
        }, this);
      })
    );

    this._disposables.add(
      this.model.propsUpdated.on(event => {
        this.edgeless.slots.elementUpdated.emit({
          id: this.model.id,
          props: {
            [event.key]: this.model[event.key as keyof typeof this.model],
          },
        });
      })
    );

    this._disposables.add(
      this.edgeless.slots.elementUpdated.on(({ id }) => {
        if (id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }
}
