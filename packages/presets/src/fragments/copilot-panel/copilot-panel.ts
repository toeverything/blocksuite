import './chat-with-workspace/chat-with-workspace.js';
import './copilot-service/index.js';

import { FrameBlockModel } from '@blocksuite/blocks';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineEditorContainer } from '../../index.js';
import { LANGUAGE, TONE } from './config.js';
import { copilotConfig } from './copilot-service/copilot-config.js';
import { CreateNewService } from './copilot-service/index.js';
import {
  allKindService,
  FastImage2ImageServiceKind,
  Image2ImageServiceKind,
  Image2TextServiceKind,
  Text2ImageServiceKind,
  TextServiceKind,
} from './copilot-service/service-base.js';
import { EditorWithAI } from './edgeless/api.js';
import { GPTAPI, type GPTAPIPayloadMap } from './text/index.js';
import { insertFromMarkdown } from './utils/markdown-utils.js';
import {
  getSelectedBlocks,
  getSelectedTextContent,
  getSurfaceElementFromEditor,
  stopPropagation,
} from './utils/selection-utils.js';

const AddCursorIcon = html`
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 12H18M12 6V18"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

@customElement('copilot-panel')
export class CopilotPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    copilot-panel {
      width: 100%;
      font-family: var(--affine-font-family);
      overflow-y: scroll;
      overflow-x: visible;
    }

    .copilot-panel-setting-title {
      font-size: 14px;
      margin-top: 12px;
      margin-bottom: 4px;
      color: var(--affine-text-secondary-color);
    }

    .copilot-panel-key-input {
      width: 100%;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      border-radius: 4px;
      padding: 8px;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .copilot-panel-action-button {
      cursor: pointer;
      user-select: none;
      padding: 4px;
      background-color: var(--affine-primary-color);
      border-radius: 8px;
      color: white;
      height: 32px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 12px;
    }

    .copilot-panel-action-prompt {
      width: 100%;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      border-radius: 4px;
      padding: 8px;
      box-sizing: border-box;
      margin-top: 8px;
    }

    .copilot-panel-action-description {
      font-size: 14px;
      margin-bottom: 8px;
      margin-top: 4px;
      color: var(--affine-text-secondary-color);
    }

    .copilot-panel-add-vendor-button {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
    }

    .copilot-panel-add-vendor-button:hover {
      background-color: var(--affine-hover-color);
    }

    .copilot-panel-vendor-item {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      padding: 2px 4px;
      border-radius: 4px;
      color: white;
    }
    .copilot-box {
      margin-bottom: 64px;
    }
  `;

  @state()
  private _result = '';

  @property({ attribute: false })
  editor!: AffineEditorContainer;
  editorWithAI?: EditorWithAI;

  get api() {
    if (!this.editorWithAI) {
      this.editorWithAI = new EditorWithAI(this.editor);
    }
    return this.editorWithAI;
  }

  get page() {
    return this.editor.page;
  }

  get host() {
    return this.editor.host;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      getSurfaceElementFromEditor(this.editor).model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

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

  config = () => {
    const createNew = (type: string) => () => {
      const panel = new CreateNewService();
      panel.type = type;
      panel.onSave = config => {
        copilotConfig.addVendor(config);
        this.requestUpdate();
        panel.remove();
      };
      document.body.appendChild(panel);
    };
    return html`
      <div style="display:flex;flex-direction: column;gap: 32px;">
        ${repeat(allKindService, v => {
          const list = copilotConfig.getVendorsByService(v);
          return html`
            <div>
              <div
                class="copilot-panel-setting-title"
                style="display:flex;justify-content:space-between;align-items:center;;color: var(--affine-text-primary-color);"
              >
                ${v.title}
                <div
                  @click="${createNew(v.type)}"
                  class="copilot-panel-add-vendor-button"
                >
                  ${AddCursorIcon}
                </div>
              </div>
              <div style="display:flex;flex-wrap: wrap;padding: 4px;gap: 4px">
                ${repeat(list, v => {
                  const style = styleMap({
                    backgroundColor: v.impl.vendor.color,
                  });
                  return html` <div
                    style="${style}"
                    class="copilot-panel-vendor-item"
                  >
                    ${v.vendor.name} ${v.impl.vendor.key} ${v.impl.name}
                  </div>`;
                })}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  };
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
    const input = await getSelectedTextContent(this.host);
    if (!input) {
      alert('Please select some text first');
      return;
    }
    return GPTAPI[key]({ input, ...payload } as never);
  };
  ask = async () => {
    const result = await this.textCompletion(this.payload.type, this.payload);
    this._result = result ?? '';
  };
  extraPayload: Record<keyof GPTAPIPayloadMap, () => TemplateResult | null> = {
    answer: () => {
      const change = (e: Event) => {
        if (e.target instanceof HTMLInputElement) {
          this.payload.question = e.target.value;
          console.log(this.payload);
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
  doc = () => {
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
            .featureKey="${'chat with workspace'}"
            .service="${TextServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
    </div>`;
  };
  workspace = () => {
    return html` <chat-with-workspace-panel
      .editor="${this.editor}"
    ></chat-with-workspace-panel>`;
  };
  edgeless = () => {
    const frames = getSurfaceElementFromEditor(
      this.editor
    ).model.children.filter(
      v => v instanceof FrameBlockModel
    ) as FrameBlockModel[];
    const changeFromFrame = (e: Event) => {
      this.api.fromFrame = (e.target as HTMLSelectElement).value;
    };
    const toggleAutoGen = () => {
      this.api.toggleAutoGen();
      this.requestUpdate();
    };
    return html`
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.api.makeItReal}"
        >
          Make It Real
        </div>
        <div class="copilot-panel-action-description">
          Select some shapes and text to generate html
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'make it real'}"
            .service="${Image2TextServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.api.createImage}"
        >
          Create Image
        </div>
        <input
          id="copilot-panel-create-image-prompt"
          class="copilot-panel-action-prompt"
          type="text"
          @keydown="${stopPropagation}"
          placeholder="Prompt"
        />
        <div class="copilot-panel-action-description">
          Type prompt to create an image.
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'text to image'}"
            .service="${Text2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div class="copilot-panel-action-button" @click="${this.api.editImage}">
          Edit Image
        </div>
        <input
          id="copilot-panel-edit-image-prompt"
          class="copilot-panel-action-prompt"
          type="text"
          @keydown="${stopPropagation}"
          placeholder="Prompt"
        />
        <div class="copilot-panel-action-description">
          Select some shapes and type prompt to edit them.
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'edit image'}"
            .service="${Image2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
      <div class="copilot-box">
        <div
          class="copilot-panel-action-button"
          @click="${this.api.htmlBlockDemo}"
        >
          HTML Block Test
        </div>
        <div class="copilot-panel-action-description">
          Generate a html block
        </div>
      </div>
      <div class="copilot-box">
        <div @click="${toggleAutoGen}" class="copilot-panel-action-button">
          ${this.api.autoGen ? 'Stop auto gen image' : 'Start auto gen image'}
        </div>
        <div class="copilot-panel-action-description">
          <div>
            Based on the shapes in frame
            <select .value="${this.api.fromFrame}" @change="${changeFromFrame}">
              <option value="">None</option>
              ${frames.map(v => {
                return html` <option .value="${v.id}">
                  ${v.title.toString()}
                </option>`;
              })}
            </select>
          </div>
          <div>Generate images to all connected frames</div>
        </div>
        <div style="display:flex;gap: 8px;flex-direction: column">
          <div
            style="font-size: 12px;color:var(--affine-text-secondary-color);"
          >
            service:
          </div>
          <vendor-service-select
            .featureKey="${'real time image to image'}"
            .service="${FastImage2ImageServiceKind}"
          ></vendor-service-select>
        </div>
      </div>
    `;
  };
  panels = {
    config: {
      render: this.config,
    },
    doc: {
      render: this.doc,
    },
    edgeless: {
      render: this.edgeless,
    },
    workspace: {
      render: this.workspace,
    },
  };
  @state()
  currentPanel: keyof typeof this.panels = 'config';

  override render() {
    const panel = this.panels[this.currentPanel];
    return html`
      <div
        style="display:flex;flex-direction: column;padding: 12px;"
        class="blocksuite-overlay"
      >
        <div style="display:flex;align-items:center;justify-content:center;">
          <div
            style="display:flex;align-items:center;justify-content:center;cursor: pointer;user-select: none;width: max-content;padding: 4px; background-color: var(--affine-hover-color);border-radius: 12px;"
          >
            ${repeat(Object.keys(this.panels), key => {
              const changePanel = () => {
                this.currentPanel = key as keyof typeof this.panels;
              };
              const style = styleMap({
                'background-color':
                  this.currentPanel === key ? 'white' : 'transparent',
                padding: '4px 8px',
                'border-radius': '8px',
              });
              return html` <div style="${style}" @click="${changePanel}">
                ${key}
              </div>`;
            })}
          </div>
        </div>
        <div>${panel.render()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-panel': CopilotPanel;
  }
}
