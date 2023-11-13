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

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );

    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );
  }

  override firstUpdated() {
    this._disposables.add(
      this.surface.page.slots.blockUpdated.on(e => {
        if (e.id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }
}
