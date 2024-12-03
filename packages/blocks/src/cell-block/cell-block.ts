/// <reference types="vite/client" />

import type { CellBlockModel } from '@blocksuite/affine-model';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { html } from 'lit';
import { property } from 'lit/decorators.js';

import type { CellBlockService } from './cell-service.js';

import { KeymapController } from './keymap-controller.js';
import { cellBlockStyles } from './styles.js';

export class CellBlockComponent extends CaptionedBlockComponent<
  CellBlockModel,
  CellBlockService
> {
  static override styles = cellBlockStyles;

  keymapController = new KeymapController(this);

  override connectedCallback() {
    super.connectedCallback();
    this.keymapController.bind();
  }

  override renderBlock() {
    return html`${this.renderChildren(this.model)}`;
  }

  @property({ attribute: false })
  override accessor widgets = {};
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-cell': CellBlockComponent;
  }
}
