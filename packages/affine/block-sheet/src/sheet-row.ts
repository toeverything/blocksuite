import type { SheetBlockModel, SheetRowModel } from '@blocksuite/affine-model';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { SheetRowService } from './sheet-service.js';

export class SheetRow extends CaptionedBlockComponent<
  SheetRowModel,
  SheetRowService
> {
  static override styles = css``;

  override render() {
    return html`<tr>
      ${repeat(
        this.model.children,
        cell => cell.id,
        cell => {
          return html`<affine-sheet-cell
            data-block-id=${cell.id}
          ></affine-sheet-cell>`;
        }
      )}
    </tr>`;
  }

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor sheetModel!: SheetBlockModel;
}
