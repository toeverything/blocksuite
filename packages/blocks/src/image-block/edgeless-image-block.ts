import { BlockElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Bound } from '../surface-block/index.js';
import type { ImageBlockModel } from './image-model.js';

@customElement('affine-edgeless-image')
export class ImageBlockEdgelessComponent extends BlockElement<ImageBlockModel> {
  @property()
  source!: string;

  get surface() {
    return this.closest('affine-edgeless-page')?.surface;
  }

  override render() {
    const bound = Bound.deserialize(
      ((this.surface?.pickById(this.model.id) as ImageBlockModel) ?? this.model)
        .xywh
    );

    return html`<img
      style=${styleMap({
        transform: `rotate(${this.model.rotate}deg)`,
        transformOrigin: 'center',
      })}
      src=${this.source}
      draggable="false"
      width="${bound.w}px"
      height="${bound.h}px"
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-image': ImageBlockEdgelessComponent;
  }
}
