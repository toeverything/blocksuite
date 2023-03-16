import type { TagSchema } from '@blocksuite/global/database';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { DatabaseBlockModel } from '../database-model.js';

@customElement('affine-database-edit-column-popup')
export class EditColumnPopup extends LitElement {
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
            this.targetModel.page.updateBlock(this.targetModel, {
              name: newName,
            });
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

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-edit-column-popup': EditColumnPopup;
  }
}
