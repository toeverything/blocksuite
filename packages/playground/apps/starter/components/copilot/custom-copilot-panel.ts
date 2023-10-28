/* eslint-disable @typescript-eslint/no-restricted-imports */

import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import type { EditorContainer } from '@blocksuite/editor';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  sendRefineRequest,
  sendSummaryRequest,
  sendTranslateRequest,
} from './api.js';
import {
  getSelectedTextContent,
  hasSelectedTextContent,
} from './selection-utils.js';

@customElement('custom-copilot-panel')
export class CustomCopilotPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .custom-copilot-container {
      position: absolute;
      top: 0;
      right: 0;
      height: 100vh;
      width: 289px;
      padding: 16px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      box-sizing: border-box;
      font-family: var(--affine-font-family);
      overflow-y: scroll;
      overflow-x: visible;
      z-index: 1;
    }

    .result-area {
      box-sizing: border-box;
      margin: 8px auto;
      padding: 8px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background: var(--affine-background-overlay-panel-color);
      white-space: pre-line;
      font-family: var(--affine-font-family);
      font-size: 12px;
    }
  `;
  @state()
  private _showPanel = false;

  @state()
  private _showCommonActionButtons = false;

  @state()
  private _result = '';

  @property({ attribute: false })
  editor!: EditorContainer;

  get page() {
    return this.editor.page;
  }

  get root() {
    return this.editor.root.value as BlockSuiteRoot;
  }

  public toggleDisplay() {
    this._showPanel = !this._showPanel;

    if (this._showPanel) {
      this._showCommonActionButtons = hasSelectedTextContent(this.root);
    }
  }

  private async _refine() {
    const selectedLines = getSelectedTextContent(this.root);
    const result = await sendRefineRequest(selectedLines);
    this._result = result;
  }

  private async _translate() {
    const selectedLines = getSelectedTextContent(this.root);
    const result = await sendTranslateRequest(selectedLines);
    this._result = result;
  }

  private async _summary() {
    const selectedLines = getSelectedTextContent(this.root);
    const result = await sendSummaryRequest(selectedLines);
    this._result = result;
  }

  private _ResultArea() {
    if (!this._result) return nothing;

    return html`
      <div class="result-area">${this._result}</div>
      <sl-button size="small" disabled> Replace </sl-button>
    `;
  }

  private _ActionButtonGroup() {
    return html` <sl-button-group label="Alignment">
      <sl-button size="small" @click=${this._refine}>Refine</sl-button>
      <sl-button size="small" @click=${this._translate}>Translate</sl-button>
      <sl-button size="small" @click=${this._summary}>Summary</sl-button>
    </sl-button-group>`;
  }

  override render() {
    return html`
      ${this._showPanel
        ? html`
            <div class="custom-copilot-container">
              ${this._showCommonActionButtons
                ? this._ActionButtonGroup()
                : 'Please select some blocks'}
              ${this._ResultArea()}
            </div>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'custom-copilot-panel': CustomCopilotPanel;
  }
}
