import type { BlockModel } from '@blocksuite/store';

import { BlockComponent, type BlockService } from '@blocksuite/block-std';
import { html, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { BlockCaptionEditor } from './block-caption.js';

export class CaptionedBlockComponent<
  Model extends BlockModel = BlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends BlockComponent<Model, Service, WidgetName> {
  constructor() {
    super();
    this.addRenderer(this._renderWithWidget);
  }

  private _renderWithWidget(content: unknown) {
    const style = styleMap({
      position: 'relative',
      ...this.blockContainerStyles,
    });

    return html`<div style=${style} class="affine-block-component">
      ${content}
      ${this.useCaptionEditor
        ? html`<block-caption-editor .block=${this}></block-caption-editor>`
        : nothing}
      ${this.showBlockSelection
        ? html`<affine-block-selection .block=${this}></affine-block-selection>`
        : nothing}
    </div>`;
  }

  get captionEditor() {
    if (!this.useCaptionEditor || !this._captionEditor) {
      console.error(
        'Oops! Please enable useCaptionEditor before accessing captionEditor'
      );
    }
    return this._captionEditor;
  }

  @query('.affine-block-component > block-caption-editor')
  private accessor _captionEditor!: BlockCaptionEditor | null;

  protected accessor blockContainerStyles: StyleInfo | undefined = undefined;

  protected accessor showBlockSelection = true;

  protected accessor useCaptionEditor = false;
}
