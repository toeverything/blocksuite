import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { SheetBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import '@blocksuite/affine-shared/commands';
import { NOTE_SELECTOR } from '@blocksuite/affine-shared/consts';
import { DocModeProvider } from '@blocksuite/affine-shared/services';
import { html, type TemplateResult } from 'lit';
import { query, state } from 'lit/decorators.js';

import type { SheetBlockService } from './sheet-service.js';

import { SheetBlockStyles } from './styles.js';

export class SheetBlockComponent extends CaptionedBlockComponent<
  SheetBlockModel,
  SheetBlockService
> {
  static override styles = SheetBlockStyles;

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(NOTE_SELECTOR);
    }
    return this.rootComponent;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._isCollapsedWhenReadOnly = this.model.collapsed;
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override renderBlock(): TemplateResult<1> {
    return html`<div>sheet</div>`;

    // const children = html`<div>${this.renderChildren(this.model)}</div>`;

    // return html`
    //   <div>
    //     <div>
    //       <rich-text></rich-text>
    //     </div>

    //     ${children}
    //   </div>
    // `;
  }

  @state()
  private accessor _isCollapsedWhenReadOnly = false;

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;
}
