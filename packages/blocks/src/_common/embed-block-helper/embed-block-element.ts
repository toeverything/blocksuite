import type { BlockService } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { Bound } from '../../surface-block/index.js';
import type { EdgelessSelectableProps } from '../edgeless/mixin/index.js';

export class EmbedBlockElement<
  Model extends
    BaseBlockModel<EdgelessSelectableProps> = BaseBlockModel<EdgelessSelectableProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockElement<Model, Service, WidgetName> {
  protected get _isInSurface() {
    const parent = this.root.querySelector('affine-edgeless-page');
    return !!parent;
  }

  get surface() {
    if (!this._isInSurface) return null;

    return this.root.querySelector('affine-surface');
  }

  get bound() {
    return Bound.deserialize(
      (this.surface?.pickById(this.model.id) ?? this.model).xywh
    );
  }

  renderEmbed = (children: () => TemplateResult) => {
    if (!this._isInSurface) {
      return html` <div class="embed-block-container">${children()}</div> `;
    }

    return html`
      <div
        class="embed-block-container"
        style=${styleMap({
          width: '100%',
          height: '100%',
        })}
      >
        ${children()}
      </div>
    `;
  };
}
