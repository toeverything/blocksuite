import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { DatabaseBlockModel } from '../database-model.js';
import TagSchema = BlockSuiteInternal.TagSchema;

@customElement('affine-database-edit-column')
export class DatabaseEditColumn extends LitElement {
  static styles = css`
    :host {
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      padding: 1rem;
    }
  `;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  targetTagSchema!: TagSchema;

  @query('input')
  titleInput!: HTMLInputElement;

  protected render(): unknown {
    return html`
      <div>
        <input value=${this.targetTagSchema.name} />
        <button
          @click=${(event: MouseEvent) => {
            const newName = this.titleInput.value;
            this.targetModel.page.captureSync();
            this.targetModel.page.setTagSchema({
              ...this.targetTagSchema,
              name: newName,
            });
            this.targetModel.propsUpdated.emit();
            requestAnimationFrame(() => {
              this.remove();
            });
          }}
        >
          Save Title Name
        </button>
      </div>
    `;
  }
}
