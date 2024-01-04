import './chat/chat.js';
import './doc/doc.js';
import './edgeless/edgeless.js';
import './copilot-service';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineEditorContainer } from '../../index.js';
import { copilotConfig } from './copilot-service/copilot-config.js';
import { CreateNewService } from './copilot-service/index.js';
import { allKindService } from './copilot-service/service-base.js';
import type { AIEdgelessLogic } from './edgeless/logic.js';
import {
  AddCursorIcon,
  ChatIcon,
  DocIcon,
  EdgelessIcon,
  SettingIcon,
} from './icons.js';
import { AILogic } from './logic.js';
import { getSurfaceElementFromEditor } from './utils/selection-utils.js';

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

  @property({ attribute: false })
  editor!: AffineEditorContainer;
  editorWithAI?: AIEdgelessLogic;
  aiLogic?: AILogic;

  get logic() {
    if (!this.aiLogic) {
      this.aiLogic = new AILogic(this.editor);
    }
    return this.aiLogic;
  }

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      getSurfaceElementFromEditor(this.editor).model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );
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

  panels: Record<
    string,
    {
      icon: TemplateResult;
      render: () => TemplateResult;
    }
  > = {
    chat: {
      icon: ChatIcon,
      render: () => {
        return html` <copilot-chat-panel
          .logic="${this.logic}"
        ></copilot-chat-panel>`;
      },
    },
    doc: {
      icon: DocIcon,
      render: () => {
        return html` <copilot-doc-panel
          .logic="${this.logic}"
        ></copilot-doc-panel>`;
      },
    },
    edgeless: {
      icon: EdgelessIcon,
      render: () => {
        return html` <copilot-edgeless-panel
          .logic="${this.logic}"
        ></copilot-edgeless-panel>`;
      },
    },
    config: {
      icon: SettingIcon,
      render: this.config,
    },
  };
  @state()
  currentPanel: keyof typeof this.panels = 'chat';

  override render() {
    const panel = this.panels[this.currentPanel];
    return html`
      <div
        style="display:flex;flex-direction: column;padding: 12px;height: 100%"
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
                display: 'flex',
                alignItems: 'center',
              });
              return html` <div style="${style}" @click="${changePanel}">
                ${this.panels[key].icon}
              </div>`;
            })}
          </div>
        </div>
        <div style="flex:1">${panel.render()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-panel': CopilotPanel;
  }
}
