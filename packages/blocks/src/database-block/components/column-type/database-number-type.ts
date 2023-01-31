import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BaseBlockModel } from '@blocksuite/store';
import NumberTagSchema = BlockSuiteInternal.NumberTagSchema;
import BlockTag = BlockSuiteInternal.BlockTag;

@customElement('database-number-type')
export class DatabaseNumberType extends LitElement {
  @property()
  targetModel!: BaseBlockModel;

  @property()
  targetTagSchema!: NumberTagSchema;

  @property()
  targetTag?: BlockTag<NumberTagSchema>;

  protected firstUpdated() {
    this.setAttribute('data-block-is-database-input', 'true');
  }

  render() {
    return html`
      <input
        .value=${this.targetTag?.value ?? 0}
        type="number"
        @focus=${() => {
          this.targetModel.page.captureSync();
        }}
        @input=${(event: Event) => {
          const target = event.target as HTMLInputElement;
          this.targetModel.page.updateBlockTag(this.targetModel.id, {
            type: this.targetTagSchema.id,
            value: isNaN(target.valueAsNumber) ? 0 : target.valueAsNumber,
          });
          this.targetModel.propsUpdated.emit();
        }}
      />
    `;
  }
}
