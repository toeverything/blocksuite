import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BaseBlockModel } from '@blocksuite/store';
import { repeat } from 'lit/directives/repeat.js';
import SelectTagSchema = BlockSuiteInternal.SelectTagSchema;

@customElement('database-select-type')
export class DatabaseSelectType extends LitElement {
  @property()
  targetModel!: BaseBlockModel;

  @property()
  targetTagSchema!: SelectTagSchema;

  override render() {
    return html`
      <div>
        <div>Select an option or create one</div>
        ${repeat(
          this.targetTagSchema.selection,
          select => html`
            <span
              style="background-color: #c0c0c0; border-radius: 10px"
              @click=${() => {
                this.targetModel.page.updateBlockTag(this.targetModel.id, {
                  type: this.targetTagSchema.id,
                  value: select,
                });
                requestAnimationFrame(() => {
                  this.remove();
                });
              }}
            >
              ${select}
            </span>
          `
        )}
      </div>
    `;
  }
}
