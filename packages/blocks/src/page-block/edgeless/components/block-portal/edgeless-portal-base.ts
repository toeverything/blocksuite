import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { property } from 'lit/decorators.js';

import type { SurfaceBlockComponent } from '../../../../index.js';
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

  protected renderModel(model: T) {
    return this.surface.root.renderModel(this.surface.unwrap(model));
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.model.childrenUpdated.on(() => {
        this.requestUpdate();
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
