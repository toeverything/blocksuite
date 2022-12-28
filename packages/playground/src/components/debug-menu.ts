/* eslint-disable @typescript-eslint/no-restricted-imports */
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import type { SlDropdown } from '@shoelace-style/shoelace';

import {
  assertExists,
  ColorStyle,
  createEvent,
  getCurrentRange,
  getModelsByRange,
  MouseMode,
  ShapeMouseMode,
  TDShapeType,
  updateSelectedTextType,
  type GroupBlockModel,
} from '@blocksuite/blocks';
import { Utils } from '@blocksuite/store';
import type { Workspace } from '@blocksuite/store';
import type { EditorContainer } from '@blocksuite/editor';

const basePath = import.meta.env.DEV
  ? 'node_modules/@shoelace-style/shoelace/dist'
  : 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.87/dist';
setBasePath(basePath);

// Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
const icons = {
  mouseDefaultMode: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
      <path
        d="M0 55.2V426c0 12.2 9.9 22 22 22c6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L179.8 320H297.9c12.2 0 22.1-9.9 22.1-22.1c0-6.3-2.7-12.3-7.4-16.5L38.6 37.9C34.3 34.1 28.9 32 23.2 32C10.4 32 0 42.4 0 55.2z"
      />
    </svg>
  `,
  mouseShapeMode: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M315.4 15.5C309.7 5.9 299.2 0 288 0s-21.7 5.9-27.4 15.5l-96 160c-5.9 9.9-6.1 22.2-.4 32.2s16.3 16.2 27.8 16.2H384c11.5 0 22.2-6.2 27.8-16.2s5.5-22.3-.4-32.2l-96-160zM288 312V456c0 22.1 17.9 40 40 40H472c22.1 0 40-17.9 40-40V312c0-22.1-17.9-40-40-40H328c-22.1 0-40 17.9-40 40zM128 512c70.7 0 128-57.3 128-128s-57.3-128-128-128S0 313.3 0 384s57.3 128 128 128z"
      />
    </svg>
  `,
};

@customElement('debug-menu')
export class DebugMenu extends LitElement {
  @property()
  workspace!: Workspace;

  @property()
  editor!: EditorContainer;

  @state()
  connected = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @state()
  mode: 'page' | 'edgeless' = 'page';

  @state()
  mouseModeType: MouseMode['type'] = 'default';

  @state()
  shapeModeColor: ShapeMouseMode['color'] = ColorStyle.Black;

  @state()
  shapeModeShape: ShapeMouseMode['shape'] = TDShapeType.Rectangle;

  @state()
  readonly = false;

  @query('#block-type-dropdown')
  blockTypeDropdown!: SlDropdown;

  get mouseMode(): MouseMode {
    if (this.mouseModeType === 'default') {
      return {
        type: this.mouseModeType,
      };
    } else {
      return {
        type: this.mouseModeType,
        color: this.shapeModeColor,
        shape: this.shapeModeShape,
      };
    }
  }

  get page() {
    return this.editor.page;
  }

  get contentParser() {
    return this.editor.contentParser;
  }

  createRenderRoot() {
    return this;
  }

  private _toggleConnection() {
    if (this.connected) {
      this.workspace.providers.forEach(provider => {
        if (!provider || !provider.disconnect) return;
        provider.disconnect();
      });
      this.connected = false;
    } else {
      this.workspace.providers.forEach(provider => {
        if (!provider || !provider.connect) return;
        provider.connect();
      });
      this.connected = true;
    }
  }

  private _convertToList(
    e: PointerEvent,
    listType: 'bulleted' | 'numbered' | 'todo'
  ) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    updateSelectedTextType('affine:list', listType, this.page);
  }

  private _addCodeBlock(e: PointerEvent) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    const range = getCurrentRange();
    const startModel = getModelsByRange(range)[0];
    const parent = this.page.getParent(startModel);
    const index = parent?.children.indexOf(startModel);
    const blockProps = {
      flavour: 'affine:code',
      text: startModel.text?.clone(),
    };
    assertExists(parent);
    this.page.captureSync();
    this.page.deleteBlock(startModel);
    this.page.addBlock(blockProps, parent, index);
  }

  private _convertToParagraph(e: PointerEvent, type: string) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    updateSelectedTextType('affine:paragraph', type, this.page);
  }

  private _switchMode() {
    this.editor.mode = this.editor.mode === 'page' ? 'edgeless' : 'page';
  }

  private _addGroup() {
    const root = this.page.root;
    if (!root) return;
    const pageId = root.id;

    this.page.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},720,480]`;

    const groupId = this.page.addBlock<GroupBlockModel>(
      { flavour: 'affine:group', xywh },
      pageId
    );
    this.page.addBlock({ flavour: 'affine:paragraph' }, groupId);
  }

  private _onSwitchMouseMode() {
    this.mouseModeType = this.mouseModeType === 'default' ? 'shape' : 'default';
  }

  private _exportHtml() {
    this.contentParser.onExportHtml();
  }

  private _toggleReadonly() {
    this.editor.readonly = !this.editor.readonly;
    this.readonly = !this.readonly;
  }

  private _exportMarkDown() {
    this.contentParser.onExportMarkdown();
  }

  private _shareUrl() {
    const base64 = Utils.encodeWorkspaceAsYjsUpdateV2(this.workspace);
    const url = new URL(window.location.toString());
    url.searchParams.set('init', base64);
    window.history.pushState({}, '', url);
  }

  firstUpdated() {
    this.page.signals.historyUpdated.on(() => {
      this.canUndo = this.page.canUndo;
      this.canRedo = this.page.canRedo;
    });
  }

  update(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('mouseModeType') ||
      changedProperties.has('shapeModeColor') ||
      changedProperties.has('shapeModeShape')
    ) {
      const event = createEvent('affine.switch-mouse-mode', this.mouseMode);
      window.dispatchEvent(event);
    }
    super.update(changedProperties);
  }

  render() {
    return html`
      <style>
        .debug-menu {
          display: flex;
          flex-wrap: nowrap;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          overflow: auto;
          z-index: 1000; /* for debug visibility */
        }
        .debug-menu > button {
          display: flex;
          flex-shrink: 0;
          justify-content: center;
          align-items: center;
          margin-left: 2px;
          margin-top: 2px;
          width: 26px;
          height: 22px;
          border: 0;
          border-radius: 2px;
          background-color: var(--affine-border-color);
          color: var(--affine-text-color);
          transition: all 0.3s;
          cursor: pointer;
        }
        .debug-menu > button:hover {
          background-color: var(--affine-hover-background);
        }
        .debug-menu > button:disabled,
        .debug-menu > button:disabled:hover {
          opacity: 0.5;
          background-color: var(--affine-border-color);
          cursor: default;
        }
        .debug-menu > button path {
          fill: var(--affine-text-color);
        }
        .debug-menu > button > * {
          flex: 1;
        }

        .button-group-toolbar {
          padding: 8px;
        }

        .button-group-toolbar sl-button-group:not(:last-of-type) {
          margin-right: var(--sl-spacing-x-small);
        }
      </style>
      <div class="debug-menu">
        <div class="button-group-toolbar">
          <!-- undo/redo group -->
          <sl-button-group label="History">
            <!-- undo -->
            <sl-tooltip content="Undo" placement="bottom" hoist>
              <sl-button
                size="small"
                content="Undo"
                .disabled=${!this.canUndo}
                tabindex="-1"
                @click=${() => this.page.undo()}
              >
                <sl-icon name="arrow-counterclockwise" label="Undo"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <!-- redo -->
            <sl-tooltip content="Redo" placement="bottom" hoist>
              <sl-button
                size="small"
                content="Redo"
                .disabled=${!this.canRedo}
                tabindex="-1"
                @click=${() => this.page.redo()}
              >
                <sl-icon name="arrow-clockwise" label="Redo"></sl-icon>
              </sl-button>
            </sl-tooltip>
          </sl-button-group>

          <!-- block type -->
          <sl-dropdown id="block-type-dropdown" placement="bottom" hoist>
            <sl-button size="small" slot="trigger" caret>
              Block Type
            </sl-button>
            <sl-menu>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._convertToParagraph(e, 'text')}
              >
                Text
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h1')}
              >
                H1
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h2')}
              >
                H2
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h3')}
              >
                H3
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h4')}
              >
                H4
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h5')}
              >
                H5
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToParagraph(e, 'h6')}
              >
                H6
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._convertToParagraph(e, 'quote')}
              >
                Quote
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._convertToList(e, 'bulleted')}
              >
                Bulleted List
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._convertToList(e, 'numbered')}
              >
                Numbered List
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._convertToList(e, 'todo')}
              >
                Todo List
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item
                @click=${(e: PointerEvent) => this._addCodeBlock(e)}
              >
                Code
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>

          <!-- test operations -->
          <sl-dropdown id="block-type-dropdown" placement="bottom" hoist>
            <sl-button size="small" slot="trigger" caret>
              Test Operations
            </sl-button>
            <sl-menu>
              <sl-menu-item @click=${this._switchMode}>
                Switch Mode
              </sl-menu-item>
              <sl-menu-item @click=${this._toggleConnection}>
                ${this.connected ? 'Disconnect' : 'Connect'}
              </sl-menu-item>
              <sl-menu-item @click=${this._addGroup}> Add Group </sl-menu-item>
              <sl-menu-item @click=${this._exportMarkDown}>
                Export Markdown
              </sl-menu-item>
              <sl-menu-item @click=${this._exportHtml}>
                Export HTML
              </sl-menu-item>
              <sl-menu-item @click=${this._toggleReadonly}>
                Toggle Readonly
              </sl-menu-item>
              <sl-menu-item @click=${this._shareUrl}> Share URL </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
        </div>
        <button
          aria-label="switch mouse mode"
          title="switch mouse mode"
          tabindex="-1"
          @click=${this._onSwitchMouseMode}
        >
          ${this.mouseMode.type === 'default'
            ? icons.mouseDefaultMode
            : icons.mouseShapeMode}
        </button>
        <select
          style="width: 72px"
          aria-label="switch shape color"
          title="switch shape color"
          name="switch shape color"
          tabindex="-1"
          @change=${(e: Event) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement) {
              const color = target.value as ColorStyle;
              this.shapeModeColor = color;
            }
          }}
        >
          <optgroup label="select a shape color">
            ${Object.entries(ColorStyle).map(([name, style]) => {
              return html`
                <option value=${style} ?selected=${style === ColorStyle.Black}>
                  ${name}
                </option>
              `;
            })}
          </optgroup>
        </select>
        <select
          style="width: 72px"
          aria-label="switch shape type"
          title="switch shape type"
          name="switch shape type"
          tabindex="-1"
          @change=${(e: Event) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement) {
              const shape = target.value as TDShapeType;
              this.shapeModeShape = shape;
            }
          }}
        >
          <optgroup label="select a shape color">
            ${Object.entries(TDShapeType).map(([name, style]) => {
              if (
                style === TDShapeType.Triangle ||
                style === TDShapeType.Rectangle
              ) {
                return html`
                  <option
                    value=${style}
                    ?selected=${style === TDShapeType.Rectangle}
                  >
                    ${name}
                  </option>
                `;
              }
              return null;
            })}
          </optgroup>
        </select>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-menu': DebugMenu;
  }
}
