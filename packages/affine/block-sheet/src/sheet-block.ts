import type { SheetBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { NOTE_SELECTOR } from '@blocksuite/affine-shared/consts';
import { DocModeProvider } from '@blocksuite/affine-shared/services';
import { css, html, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import type { SheetBlockService } from './sheet-service.js';

export class SheetBlockComponent extends CaptionedBlockComponent<
  SheetBlockModel,
  SheetBlockService
> {
  static override styles = css`
    .affine-sheet-wrapper {
      position: relative;
    }

    table,
    th,
    td {
      border: 1px solid #d9d9d9;
    }

    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }

    td {
      min-width: 20px;
      min-height: 20px;
      padding: 4px 8px;
      overflow: hidden;
      word-break: break-all;
      overflow-wrap: break-word;
    }
  `;

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(NOTE_SELECTOR);
    }
    return this.rootComponent;
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override renderBlock(): TemplateResult<1> {
    return html`<div class="affine-sheet-wrapper">
      <table>
        <tbody>
          ${repeat(
            this.model.children,
            row => row.id,
            row => {
              return html`<affine-sheet-row
                data-block-id=${row.id}
              ></affine-sheet-row>`;
            }
          )}
        </tbody>
      </table>
    </div>`;
  }
}
