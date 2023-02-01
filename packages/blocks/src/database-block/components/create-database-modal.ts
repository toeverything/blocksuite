/**
 * When user select blocks and click `create database` in quick bar, this form will pop up
 */
import { customElement, property } from 'lit/decorators.js';
import { html, LitElement } from 'lit';

export const CREATE_DATABASE_MODAL_TAG =
  'affine-create-database-modal' as const;

export enum DatabaseViewType {
  Table = 'table',
  List = 'list',
}

export type OnConfirm = (viewType: DatabaseViewType) => void;

@customElement(CREATE_DATABASE_MODAL_TAG)
export class CreateDatabaseModal extends LitElement {
  @property()
  onConfirm: OnConfirm | null = null;

  private _onConfirm = () => {
    if (this.onConfirm) {
      this.onConfirm(DatabaseViewType.Table);
    }
  };

  protected render() {
    return html`
      <div>Select Database View</div>
      <div @click=${this._onConfirm}>create a table view</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [CREATE_DATABASE_MODAL_TAG]: CreateDatabaseModal;
  }
}
