/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';

import {
  createEvent,
  type FrameBlockModel,
  getModelsByRange,
  MouseMode,
  NonShadowLitElement,
  SelectionUtils,
  ShapeMouseMode,
  updateSelectedTextType,
} from '@blocksuite/blocks';
import type { EditorContainer } from '@blocksuite/editor';
import {
  CSSColorProperties,
  CSSSizeProperties,
  plate,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { ShapeType } from '@blocksuite/phasor';
import type { Workspace } from '@blocksuite/store';
import { Utils } from '@blocksuite/store';
import type {
  SlColorPicker,
  SlDropdown,
  SlSelect,
} from '@shoelace-style/shoelace';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { GUI } from 'dat.gui';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

const basePath = import.meta.env.DEV
  ? 'node_modules/@shoelace-style/shoelace/dist'
  : 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.87/dist';
setBasePath(basePath);

@customElement('debug-menu')
export class DebugMenu extends NonShadowLitElement {
  static styles = css`
    :root {
      --sl-font-size-medium: var(--affine-font-xs);
      --sl-input-font-size-small: var(--affine-font-xs);
    }

    .dg.ac {
      z-index: 1001 !important;
    }
  `;

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
  showGrid = false;

  @state()
  shapeModeColor: ShapeMouseMode['color'] = '#000000';

  @state()
  shapeModeShape: ShapeMouseMode['shape'] = 'rect';

  @state()
  readonly = false;

  @state()
  hasOffset = false;

  @query('#block-type-dropdown')
  blockTypeDropdown!: SlDropdown;

  private _styleMenu!: GUI;
  private _showStyleDebugMenu = false;

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

    updateSelectedTextType('affine:list', listType);
  }

  private _addCodeBlock(e: PointerEvent) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    const range = SelectionUtils.getCurrentRange();
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

    updateSelectedTextType('affine:paragraph', type);
  }

  private _switchEditorMode() {
    const mode = this.editor.mode === 'page' ? 'edgeless' : 'page';
    this.mode = mode;
  }

  private _switchOffsetMode() {
    this.hasOffset = !this.hasOffset;
  }

  private _addFrame() {
    const root = this.page.root;
    if (!root) return;
    const pageId = root.id;

    this.page.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},720,480]`;

    const frameId = this.page.addBlock<FrameBlockModel>(
      { flavour: 'affine:frame', xywh },
      pageId
    );
    this.page.addBlock({ flavour: 'affine:paragraph' }, frameId);
  }

  private _switchMouseMode() {
    this.mouseModeType = this.mouseModeType === 'default' ? 'shape' : 'default';
  }

  private _switchShowGrid() {
    this.showGrid = !this.showGrid;
  }

  private _exportHtml() {
    this.contentParser.onExportHtml();
  }

  private _exportMarkDown() {
    this.contentParser.onExportMarkdown();
  }

  private _exportYDoc() {
    this.workspace.exportYDoc();
  }

  private _shareUrl() {
    const base64 = Utils.encodeWorkspaceAsYjsUpdateV2(this.workspace);
    const url = new URL(window.location.toString());
    url.searchParams.set('init', base64);
    window.history.pushState({}, '', url);
  }

  private _toggleStyleDebugMenu() {
    this._showStyleDebugMenu = !this._showStyleDebugMenu;
    this._showStyleDebugMenu ? this._styleMenu.show() : this._styleMenu.hide();
  }

  private _setReadonlyOthers() {
    const clients = [...this.page.awarenessStore.getStates().keys()].filter(
      id => id !== this.page.workspace.doc.clientID
    );
    if (this.page.awarenessStore.getFlag('enable_set_remote_flag')) {
      clients.forEach(id => {
        this.page.awarenessStore.setRemoteFlag(id, 'readonly', {
          ...(this.page.awarenessStore.getFlag('readonly') ?? {}),
          [this.page.prefixedId]: true,
        });
      });
    }
  }

  firstUpdated() {
    this.page.signals.historyUpdated.on(() => {
      this.canUndo = this.page.canUndo;
      this.canRedo = this.page.canRedo;
    });
    this._styleMenu = new GUI({ hideable: false });
    this._styleMenu.width = 350;
    const style = document.documentElement.style;
    const sizeFolder = this._styleMenu.addFolder('Size');
    sizeFolder.open();
    CSSSizeProperties.forEach(item => {
      const { name, defaultValue, cssProperty } = item;
      sizeFolder.add({ [name]: defaultValue }, name, 0, 100).onChange(e => {
        style.setProperty(cssProperty, Math.round(e) + 'px');
      });
    });

    const colorFolder = this._styleMenu.addFolder('Color');
    colorFolder.open();
    CSSColorProperties.forEach(item => {
      const { name, cssProperty } = item;
      colorFolder.addColor(plate, name).onChange((color: string | null) => {
        style.setProperty(cssProperty, color);
      });
    });
    this._styleMenu.hide();
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
    if (changedProperties.has('mode')) {
      const mode = this.mode;
      this.editor.mode = mode;
    }
    if (changedProperties.has('showGrid')) {
      window.dispatchEvent(
        createEvent('affine:switch-edgeless-display-mode', this.showGrid)
      );
    }
    if (changedProperties.has('hasOffset')) {
      document.body.style.margin = this.hasOffset ? '60px 0 0 40px' : '0';
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
          pointer-events: none;
        }

        .default-toolbar {
          padding: 8px;
          width: 100%;
          min-width: 390px;
        }

        .default-toolbar > * {
          pointer-events: auto;
        }

        .edgeless-toolbar {
          align-items: center;
          margin-right: 17px;
          pointer-events: auto;
        }

        .edgeless-toolbar sl-select,
        .edgeless-toolbar sl-color-picker,
        .edgeless-toolbar sl-button {
          margin-right: 4px;
        }
      </style>
      <div class="debug-menu default">
        <div class="default-toolbar">
          <!-- undo/redo group -->
          <sl-button-group label="History">
            <!-- undo -->
            <sl-tooltip content="Undo" placement="bottom" hoist>
              <sl-button
                size="small"
                content="Undo"
                .disabled=${!this.canUndo}
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
              <sl-menu-item @click=${this._toggleConnection}>
                ${this.connected ? 'Disconnect' : 'Connect'}
              </sl-menu-item>
              <sl-menu-item @click=${this._addFrame}> Add Frame</sl-menu-item>
              <sl-menu-item @click=${this._setReadonlyOthers}>
                Set Others Readonly
              </sl-menu-item>
              <sl-menu-item @click=${this._exportMarkDown}>
                Export Markdown
              </sl-menu-item>
              <sl-menu-item @click=${this._exportHtml}>
                Export HTML
              </sl-menu-item>
              <sl-menu-item @click=${this._exportYDoc}>
                Export YDoc
              </sl-menu-item>
              <sl-menu-item @click=${this._shareUrl}> Share URL</sl-menu-item>
              <sl-menu-item @click=${this._toggleStyleDebugMenu}>
                Toggle CSS Debug Menu
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>

          <sl-tooltip content="Switch Editor Mode" placement="bottom" hoist>
            <sl-button
              size="small"
              content="Switch Editor Mode"
              @click=${this._switchEditorMode}
            >
              <sl-icon name="phone-flip"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-tooltip content="Add container offset" placement="bottom" hoist>
            <sl-button
              size="small"
              content="Add container offset"
              @click=${this._switchOffsetMode}
            >
              <sl-icon name="aspect-ratio"></sl-icon>
            </sl-button>
          </sl-tooltip>
        </div>

        <div
          class="edgeless-toolbar"
          style=${'display:' + (this.mode === 'edgeless' ? 'flex' : 'none')}
        >
          <sl-tooltip content="Show Grid" placement="bottom" hoist>
            <sl-button
              size="small"
              content="Show Grid"
              @click=${this._switchShowGrid}
            >
              <sl-icon name=${!this.showGrid ? 'square' : 'grid-3x3'}>
              </sl-icon>
            </sl-button>
          </sl-tooltip>
          <sl-tooltip content="Switch Mouse Mode" placement="bottom" hoist>
            <sl-button
              size="small"
              content="Switch Mouse Mode"
              @click=${this._switchMouseMode}
            >
              <sl-icon
                name=${this.mouseMode.type === 'default'
                  ? 'cursor'
                  : 'pentagon'}
              >
              </sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-color-picker
            size="small"
            value="#000000"
            hoist
            label="Shape Color"
            @sl-change=${(e: CustomEvent) => {
              const target = e.target as SlColorPicker;
              this.shapeModeColor = target.value as `#${string}`;
            }}
          ></sl-color-picker>
          <sl-select
            placeholder="Shape Type"
            size="small"
            value=${this.shapeModeShape}
            aria-label="Shape Type"
            hoist
            @sl-change=${(e: CustomEvent) => {
              const target = e.target as SlSelect;
              this.shapeModeShape = target.value as ShapeType;
            }}
          >
            <sl-menu-item value="rectangle">Rectangle</sl-menu-item>
            <sl-menu-item value="triangle">Triangle</sl-menu-item>
            <sl-menu-item value="ellipse">Ellipse</sl-menu-item>
          </sl-select>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-menu': DebugMenu;
  }
}
