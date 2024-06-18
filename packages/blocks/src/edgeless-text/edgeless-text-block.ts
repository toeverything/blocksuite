import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { isCssVariable } from '../_common/theme/css-variables.js';
import { wrapFontFamily } from '../surface-block/utils/font.js';
import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

export const EDGELESS_TEXT_BLOCK_MIN_WIDTH = 50;
export const EDGELESS_TEXT_BLOCK_MIN_HEIGHT = 50;

@customElement('affine-edgeless-text')
export class EdgelessTextBlockComponent extends BlockElement<EdgelessTextBlockModel> {
  tryFocusEnd() {
    const paragraphOrLists = Array.from(
      this.querySelectorAll<BlockElement>('affine-paragraph, affine-list')
    );
    const last = paragraphOrLists.at(-1);
    if (last) {
      this.host.selection.setGroup('note', [
        this.host.selection.create('text', {
          from: {
            blockId: last.blockId,
            index: last.model.text?.length ?? 0,
            length: 0,
          },
          to: null,
        }),
      ]);
    }
  }

  @query('.affine-block-children-container')
  accessor childrenContainer!: HTMLDivElement;

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.updateComplete
          .then(() => {
            const command = this.host.command;
            const blockSelections = this.model.children.map(child =>
              this.host.selection.create('block', {
                blockId: child.id,
              })
            );

            if (key === 'fontStyle') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  italic: null,
                },
              });
            } else if (key === 'color') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  color: null,
                },
              });
            } else if (key === 'fontWeight') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  bold: null,
                },
              });
            }
          })
          .catch(console.error);
      })
    );
  }

  override renderBlock() {
    const { color, fontFamily, fontStyle, fontWeight, textAlign } = this.model;

    const style = styleMap({
      color: isCssVariable(color) ? `var(${color})` : color,
      fontFamily: wrapFontFamily(fontFamily),
      fontStyle,
      fontWeight,
      textAlign,
    });

    return html`
      <div style=${style} class="affine-edgeless-text-block-container">
        <div class="affine-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-text': EdgelessTextBlockComponent;
  }
}
