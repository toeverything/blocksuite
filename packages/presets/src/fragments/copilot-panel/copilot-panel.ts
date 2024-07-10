import './chat/chat.js';
import './edgeless/edgeless.js';
import './copilot-service/index.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineEditorContainer } from '../../index.js';
import type { AllAction } from './chat/logic.js';
import { copilotConfig } from './copilot-service/copilot-config.js';
import { CreateNewService } from './copilot-service/index.js';
import { allKindService } from './copilot-service/service-base.js';
import type { AIEdgelessLogic } from './edgeless/logic.js';
import { AddCursorIcon, StarIcon } from './icons.js';
import { AILogic } from './logic.js';
import { getSurfaceElementFromEditor } from './utils/selection-utils.js';

@customElement('copilot-panel')
export class CopilotPanel extends WithDisposable(ShadowlessElement) {
  get host() {
    return this.editor.host;
  }

  get logic() {
    if (!this.aiLogic) {
      this.aiLogic = new AILogic(() => this.host);
    }
    return this.aiLogic;
  }

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

    .service-provider-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .service-type {
      font-size: 14px;
      color: var(--affine-text-secondary-color);
    }
  `;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  editorWithAI?: AIEdgelessLogic;

  aiLogic?: AILogic;

  config = () => {
    const createNew = (type: string) => () => {
      const panel = new CreateNewService();
      panel.type = type;
      panel.onSave = config => {
        copilotConfig.addVendor(config);
        this.requestUpdate();
        panel.remove();
      };
      document.body.append(panel);
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

  // eslint-disable-next-line @typescript-eslint/member-ordering
  panels: Record<
    string,
    {
      render: () => TemplateResult;
    }
  > = {
    Chat: {
      render: () => {
        return html` <copilot-chat-panel
          .logic="${this.logic}"
        ></copilot-chat-panel>`;
      },
    },
    Edgeless: {
      render: () => {
        return html` <copilot-edgeless-panel
          .logic="${this.logic}"
        ></copilot-edgeless-panel>`;
      },
    },
    Config: {
      render: this.config,
    },
  };

  @state()
  accessor currentPanel: keyof typeof this.panels = 'Chat';

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      getSurfaceElementFromEditor(this.host).model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    const panel = this.panels[this.currentPanel];
    return html`
      <div style="display:flex;flex-direction: column;height: 100%">
        <div
          style="display:flex;align-items:center;justify-content:center; padding-top: 17px;"
        >
          <div
            style="display:flex;align-items:center;justify-content:center;cursor: pointer;user-select: none;width: max-content;padding: 4px; background-color: var(--affine-hover-color);border-radius: 12px;"
          >
            ${repeat(Object.keys(this.panels), key => {
              const changePanel = () => {
                this.currentPanel = key as keyof typeof this.panels;
              };
              const style = styleMap({
                'background-color':
                  this.currentPanel === key
                    ? 'var(--affine-hover-color)'
                    : 'transparent',
                padding: '4px 8px',
                'border-radius': '8px',
                width: '91px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                color:
                  key === this.currentPanel
                    ? 'var(--affine-text-primary-color)'
                    : 'var(--affine-text-secondary-color)',
              });
              return html` <div style="${style}" @click="${changePanel}">
                ${key}
              </div>`;
            })}
          </div>
        </div>
        <div style="flex:1;overflow: hidden">${panel.render()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'copilot-panel': CopilotPanel;
  }
}

export const affineFormatBarItemConfig = {
  type: 'custom' as const,
  render(): TemplateResult | null {
    const copilot = document.querySelector('copilot-panel');
    if (!copilot) {
      return null;
    }
    const renderItem = (item: AllAction): TemplateResult => {
      if (item.type === 'group') {
        return html`
          <sl-menu-item>
            ${item.name}
            <sl-menu slot="submenu">
              ${repeat(item.children, renderItem)}
            </sl-menu>
          </sl-menu-item>
        `;
      }
      return html`
        <sl-menu-item @click="${() => item.action()}"
          >${item.name}</sl-menu-item
        >
      `;
    };
    return html`
      <style>
        .copilot-format-bar-item {
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--affine-icon-color);
        }
        .copilot-format-bar-item:hover {
          background-color: var(--affine-hover-color);
        }
      </style>
      <div class="copilot-format-bar-item">
        <sl-dropdown>
          <div
            slot="trigger"
            style="display:flex;align-items:center;gap: 4px;"
            caret
          >
            ${StarIcon} Ask AI
          </div>
          <sl-menu>
            ${repeat(
              copilot.aiLogic?.chat.docSelectionActionList ?? [],
              renderItem
            )}
          </sl-menu>
        </sl-dropdown>
      </div>
    `;
  },
};
