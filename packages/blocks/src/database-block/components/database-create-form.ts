/**
 * When user select blocks and click `create database` in quick bar, this form will pop up
 */
import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';

export const DatabaseCreateFormTag = 'affine-database-create-form' as const;

export enum DatabaseViewType {
  Table = 'table',
  List = 'list',
}

export type OnConform = (viewType: DatabaseViewType) => void;
@customElement(DatabaseCreateFormTag)
export class DatabaseCreateForm extends LitElement {
  @property()
  onConform: OnConform | null = null;

  private _onConform = () => {
    if (this.onConform) {
      this.onConform(DatabaseViewType.Table);
    }
  };

  protected render() {
    return html`
      <div>Select Database View</div>
      <div @click=${this._onConform}>create a table view</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [DatabaseCreateFormTag]: DatabaseCreateForm;
  }
}
