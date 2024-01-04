import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { LANGUAGE, TONE } from '../config.js';
import { TextServiceKind } from '../copilot-service/service-base.js';
import type { AILogic } from '../logic.js';
import { insertFromMarkdown } from '../utils/markdown-utils.js';
import {
  getSelectedBlocks,
  getSelectedTextContent,
} from '../utils/selection-utils.js';
import { TextCompletionFeatureKey } from './api.js';
import { GPTAPI, type GPTAPIPayloadMap } from './index.js';

@customElement('copilot-doc-panel')
export class CopilotDocPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css``;
  @property({ attribute: false })
  logic!: AILogic;
  get editor() {
    return this.logic.editor;
  }

  get page() {
    return this.editor.page;
  }

  get host() {
    return this.editor.host;
  }

  @state()
  payload: {
    type: keyof GPTAPIPayloadMap;
  } & Record<string, unknown> = {
    type: 'answer',
  };
  changeType = (e: Event) => {
    if (e.target instanceof HTMLSelectElement) {
      this.payload = { type: e.target.value as keyof GPTAPIPayloadMap };
    }
  };
  textCompletion = async <K extends keyof GPTAPIPayloadMap>(
    key: K,
    payload: Omit<GPTAPIPayloadMap[K], 'input'>
  ) => {
    const input = await getSelectedTextContent(this.editor.host);
    if (!input) {
      alert('Please select some text first');
      return;
    }
    return GPTAPI[key]({ input, ...payload } as never);
  };
  @state()
  private _result = '';
  ask = async () => {
    const result = await this.textCompletion(this.payload.type, this.payload);
    this._result = result ?? '';
  };

  private async _replace() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.host);
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
      this.host,
      this._result,
      parentBlock.model.id,
      firstIndex
    );
    setTimeout(() => {
      const parentPath = firstBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.host.selection.create('block', { path }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }

  private async _insertBelow() {
    if (!this._result) return;

    const selectedBlocks = await getSelectedBlocks(this.host);
    const blockLength = selectedBlocks.length;
    if (!blockLength) return;

    const lastBlock = selectedBlocks[blockLength - 1];
    const parentBlock = lastBlock.parentBlockElement;

    const lastIndex = parentBlock.model.children.findIndex(
      child => child.id === lastBlock.model.id
    ) as number;

    const models = await insertFromMarkdown(
      this.host,
      this._result,
      parentBlock.model.id,
      lastIndex + 1
    );

    setTimeout(() => {
      const parentPath = lastBlock.parentPath;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => this.host.selection.create('block', { path }));
      this.host.selection.setGroup('note', selections);
    }, 0);
  }

  private _ResultArea() {
    if (!this._result) return nothing;

    return html`
      <div style="margin-top: 16px;">${this._result}</div>
      <div style="display:flex;align-items:center;">
        <div
          class="copilot-panel-action-button"
          style="flex: 1;"
          @click="${this._replace}"
        >
          Replace
        </div>
        <div
          class="copilot-panel-action-button"
          style="flex: 1;"
          @click="${this._insertBelow}"
        >
          Insert below
        </div>
      </div>
    `;
  }

  extraPayload: Record<keyof GPTAPIPayloadMap, () => TemplateResult | null> = {
    answer: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLInputElement) {
          this.payload.question = e.target.value;
        }
      };
      return html` <div style="margin-top: 16px;">
        <input
          class="copilot-panel-action-prompt"
          type="text"
          .value="${this.payload.question ?? ''}"
          @input="${change}"
        />
      </div>`;
    },
    refine: () => null,
    generate: () => null,
    summary: () => null,
    translate: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLSelectElement) {
          this.payload.language = e.target.value;
        }
      };
      return html` <div style="margin-top: 16px;">
        <div style="display:flex;align-items:center;">
          <div style="margin-right: 4px;">Language:</div>
          <select @change="${change}">
            ${repeat(LANGUAGE, key => {
              return html` <option>${key}</option>`;
            })}
          </select>
        </div>
      </div>`;
    },
    improveWriting: () => null,
    fixSpelling: () => null,
    makeShorter: () => null,
    makeLonger: () => null,
    changeTone: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLSelectElement) {
          this.payload.tone = e.target.value;
        }
      };
      return html` <div style="margin-top: 16px;">
        <div style="display:flex;align-items:center;">
          <div style="margin-right: 4px;">Tone:</div>
          <select @change="${change}">
            ${repeat(TONE, key => {
              return html` <option>${key}</option>`;
            })}
          </select>
        </div>
      </div>`;
    },
    simplifyLanguage: () => null,
  };
  protected override render(): unknown {
    return html` <div style="margin-top: 16px;">
      <div style="display:flex;align-items:center;">
        <div style="margin-right: 4px;">Action:</div>
        <select @change="${this.changeType}">
          ${repeat(Object.keys(GPTAPI), key => {
            return html` <option>${key}</option>`;
          })}
        </select>
      </div>
      ${this.extraPayload[this.payload.type]()}
      <div class="copilot-panel-action-button" @click="${this.ask}">Ask</div>
      <div>${this._ResultArea()}</div>

      <div
        style="display:flex;flex-direction: column;gap: 12px;margin-top: 12px;"
      >
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            chat service:
          </div>
          <vendor-service-select
            .featureKey="${TextCompletionFeatureKey}"
            .service="${TextServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-doc-panel': CopilotDocPanel;
  }
}
