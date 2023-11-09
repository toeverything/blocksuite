/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import type { EditorContainer } from '@blocksuite/editor';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { SlPopup } from '@shoelace-style/shoelace';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  sendChangeToneRequest,
  sendFixSpellingRequest,
  sendImproveWritingRequest,
  sendMakeLongerRequest,
  sendMakeShorterRequest,
  sendRefineRequest,
  sendSimplifyLanguageRequest,
  sendSummaryRequest,
  sendTranslateRequest,
} from './api.js';
import { LANGUAGE, TONE } from './config.js';
import { insertFromMarkdown } from './utils/markdown-utils.js';
import {
  getSelectedBlocks,
  getSelectedTextContent,
  hasSelectedTextContent,
} from './utils/selection-utils.js';

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

    .action-button-group {
      display: flex;
      align-items: center;
      width: 100%;
      flex-wrap: wrap;
      gap: 4px;
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
      overflow-wrap: break-word;
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

  private _lastPayload: { [key: string]: string } | null = null;
  private _langPopupTimer: ReturnType<typeof setTimeout> | null = null;
  private _tonePopupTimer: ReturnType<typeof setTimeout> | null = null;

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

  private get _selectedTextContent() {
    return getSelectedTextContent(this.root);
  }

  private async _sendRequest(payload: { [key: string]: string }) {
    let result = '';
    switch (payload.action) {
      case 'refine':
        result = await sendRefineRequest(payload.input);
        break;
      case 'translate':
        result = await sendTranslateRequest(payload.input, payload.language);
        break;
      case 'summary':
        result = await sendSummaryRequest(payload.input);
        break;
      case 'improveWriting':
        result = await sendImproveWritingRequest(payload.input);
        break;
      case 'fixSpelling':
        result = await sendFixSpellingRequest(payload.input);
        break;
      case 'makeShorter':
        result = await sendMakeShorterRequest(payload.input);
        break;
      case 'makeLonger':
        result = await sendMakeLongerRequest(payload.input);
        break;
      case 'changeTone':
        result = await sendChangeToneRequest(payload.input, payload.tone);
        break;
      case 'simplifyLanguage':
        result = await sendSimplifyLanguageRequest(payload.input);
        break;
    }

    return result;
  }

  private async _handleActionClick(
    action: string,
    options?: { [key: string]: string }
  ) {
    const payload = {
      action,
      input: await this._selectedTextContent,
      ...options,
    };

    this._lastPayload = payload;
    this._result = await this._sendRequest(payload);
  }

  private _clearState() {
    this._result = '';
    this._lastPayload = null;
    this._langPopupTimer = null;
    this._tonePopupTimer = null;
  }

  private async _replace() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.root);
    if (!selectedBlocks.length) return;

    const firstBlock = selectedBlocks[0];
    const parentBlock = firstBlock.parentBlockElement;

    // update selected block
    const firstIndex = parentBlock.model.children.findIndex(
      child => child.id === firstBlock.model.id
    ) as number;
    selectedBlocks.forEach(block => {
      this.page.deleteBlock(block.model);
    });

    const models = await insertFromMarkdown(
      this.root,
      this._result,
      parentBlock.model.id,
      firstIndex
    );

    setTimeout(async () => {
      const parentPath = firstBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.root.selection.getInstance('block', { path }));
      this.root.selection.setGroup('note', selections);
    }, 0);

    this._clearState();
  }

  private async _insertBelow() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.root);
    const blockLength = selectedBlocks.length;
    if (!blockLength) return;

    const lastBlock = selectedBlocks[blockLength - 1];
    const parentBlock = lastBlock.parentBlockElement;

    const lastIndex = parentBlock.model.children.findIndex(
      child => child.id === lastBlock.model.id
    ) as number;

    const models = await insertFromMarkdown(
      this.root,
      this._result,
      parentBlock.model.id,
      lastIndex + 1
    );

    setTimeout(async () => {
      const parentPath = lastBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.root.selection.getInstance('block', { path }));
      this.root.selection.setGroup('note', selections);
    }, 0);

    this._clearState();
  }

  private async _retry() {
    if (!this._lastPayload) return;

    this._result = await this._sendRequest(this._lastPayload);
  }

  private _ResultArea() {
    if (!this._result) return nothing;

    return html`
      <div class="result-area">${this._result}</div>
      <sl-button size="small" @click=${this._replace}> Replace </sl-button>
      <sl-button size="small" @click=${this._insertBelow}>
        Insert below
      </sl-button>
      <sl-button size="small" @click=${this._retry}> Retry </sl-button>
    `;
  }

  private _activeLanguagePopup() {
    const languagePopup = this.shadowRoot?.getElementById('language-popup');
    if (!languagePopup) return;

    if (this._langPopupTimer) clearTimeout(this._langPopupTimer);

    (languagePopup as SlPopup).active = true;
  }

  private _disactiveLanguagePopup(delay = 0) {
    const languagePopup = this.shadowRoot?.getElementById('language-popup');
    if (!languagePopup) return;

    this._langPopupTimer = setTimeout(() => {
      if (!languagePopup.matches(':hover')) {
        (languagePopup as SlPopup).active = false;
      }
    }, delay);
  }

  private _activeTonePopup() {
    const tonePopup = this.shadowRoot?.getElementById('tone-popup');
    if (!tonePopup) return;

    if (this._tonePopupTimer) clearTimeout(this._tonePopupTimer);
    (tonePopup as SlPopup).active = true;
  }

  private _disactiveTonePopup(delay = 0) {
    const tonePopup = this.shadowRoot?.getElementById('tone-popup');
    if (!tonePopup) return;

    this._tonePopupTimer = setTimeout(() => {
      if (!tonePopup.matches(':hover')) {
        (tonePopup as SlPopup).active = false;
      }
    }, delay);
  }

  private _ActionButtonGroup() {
    return html` <sl-dropdown
      id="copilot-actions-dropdown"
      placement="bottom"
      hoist
    >
      <sl-button size="small" slot="trigger" caret> Ask AI </sl-button>
      <sl-menu id="copilot-actions-menu">
        <sl-menu-item @click=${() => this._handleActionClick('refine')}>
          Refine
        </sl-menu-item>
        <sl-menu-item
          @mouseenter=${this._activeLanguagePopup}
          @mouseleave=${() => this._disactiveLanguagePopup(200)}
        >
          Translate
        </sl-menu-item>
        <sl-menu-item @click=${() => this._handleActionClick('summary')}>
          Summarize
        </sl-menu-item>
        <sl-menu-item @click=${() => this._handleActionClick('makeLonger')}>
          Make Longer
        </sl-menu-item>
        <sl-menu-item @click=${() => this._handleActionClick('makeShorter')}>
          Make Shorter
        </sl-menu-item>
        <sl-menu-item
          @mouseenter=${this._activeTonePopup}
          @mouseleave=${() => this._disactiveTonePopup(200)}
        >
          Change Tone
        </sl-menu-item>
        <sl-menu-item @click=${() => this._handleActionClick('improveWriting')}>
          Improve Writing
        </sl-menu-item>
        <sl-menu-item
          @click=${() => this._handleActionClick('simplifyLanguage')}
        >
          Simplify Language
        </sl-menu-item>
        <sl-menu-item @click=${() => this._handleActionClick('fixSpelling')}>
          Fix Spelling and Grammar
        </sl-menu-item>
      </sl-menu>
      <sl-popup
        id="language-popup"
        anchor="copilot-actions-menu"
        placement="right"
        @mouseleave=${() => this._disactiveLanguagePopup(100)}
      >
        <sl-menu>
          ${LANGUAGE.map(
            language => html`
              <sl-menu-item
                @click=${() =>
                  this._handleActionClick('translate', { language })}
              >
                ${language}
              </sl-menu-item>
            `
          )}
        </sl-menu>
      </sl-popup>
      <sl-popup
        id="tone-popup"
        anchor="copilot-actions-menu"
        placement="right"
        @mouseleave=${() => this._disactiveTonePopup(100)}
      >
        <sl-menu>
          ${TONE.map(
            tone => html`
              <sl-menu-item
                @click=${() => this._handleActionClick('changeTone', { tone })}
              >
                ${tone}
              </sl-menu-item>
            `
          )}
        </sl-menu>
      </sl-popup>
    </sl-dropdown>`;
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
