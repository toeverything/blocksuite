/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
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
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';

import {
  activeEditorManager,
  COLOR_VARIABLES,
  extractCssVariables,
  FONT_FAMILY_VARIABLES,
  getCurrentBlockRange,
  SelectionUtils,
  SIZE_VARIABLES,
  updateBlockType,
  VARIABLES,
} from '@blocksuite/blocks';
import { LINK_PRE } from '@blocksuite/blocks/__internal__/content-parser/parse-html';
import type { ContentParser } from '@blocksuite/blocks/content-parser';
import { EditorContainer } from '@blocksuite/editor';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement } from '@blocksuite/lit';
import { type Page, Utils, type Workspace } from '@blocksuite/store';
import type { SlDropdown, SlTab, SlTabGroup } from '@shoelace-style/shoelace';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { GUI } from 'dat.gui';
import JSZip from 'jszip';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { registerFormatBarCustomElement } from './custom-format-bar';
import { createViewer } from './doc-inspector';

const cssVariablesMap = extractCssVariables(document.documentElement);
const plate: Record<string, string> = {};
COLOR_VARIABLES.forEach((key: string) => {
  plate[key] = cssVariablesMap[key];
});
const OTHER_CSS_VARIABLES = VARIABLES.filter(
  variable =>
    !SIZE_VARIABLES.includes(variable) &&
    !COLOR_VARIABLES.includes(variable) &&
    !FONT_FAMILY_VARIABLES.includes(variable)
);

const basePath = import.meta.env.DEV
  ? 'node_modules/@shoelace-style/shoelace/dist'
  : 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.87/dist';
setBasePath(basePath);

function init_css_debug_menu(styleMenu: GUI, style: CSSStyleDeclaration) {
  const sizeFolder = styleMenu.addFolder('Size');
  const fontFamilyFolder = styleMenu.addFolder('FontFamily');
  const colorFolder = styleMenu.addFolder('Color');
  const othersFolder = styleMenu.addFolder('Others');
  sizeFolder.open();
  fontFamilyFolder.open();
  colorFolder.open();
  othersFolder.open();
  SIZE_VARIABLES.forEach(name => {
    sizeFolder
      .add(
        {
          [name]: isNaN(parseFloat(cssVariablesMap[name]))
            ? 0
            : parseFloat(cssVariablesMap[name]),
        },
        name,
        0,
        100
      )
      .onChange(e => {
        style.setProperty(name, `${Math.round(e)}px`);
      });
  });
  FONT_FAMILY_VARIABLES.forEach(name => {
    fontFamilyFolder
      .add(
        {
          [name]: cssVariablesMap[name],
        },
        name
      )
      .onChange(e => {
        style.setProperty(name, e);
      });
  });
  OTHER_CSS_VARIABLES.forEach(name => {
    othersFolder.add({ [name]: cssVariablesMap[name] }, name).onChange(e => {
      style.setProperty(name, e);
    });
  });
  fontFamilyFolder
    .add(
      {
        '--affine-font-family':
          'Roboto Mono, apple-system, BlinkMacSystemFont,Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,Segoe UI Symbol, Noto Color Emoji',
      },
      '--affine-font-family'
    )
    .onChange(e => {
      style.setProperty('--affine-font-family', e);
    });
  for (const plateKey in plate) {
    colorFolder.addColor(plate, plateKey).onChange((color: string | null) => {
      style.setProperty(plateKey, color);
    });
  }
}

@customElement('debug-menu')
export class DebugMenu extends ShadowlessElement {
  static override styles = css`
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

  @property()
  contentParser!: ContentParser;

  @state()
  private _connected = true;

  @state()
  private _canUndo = false;

  @state()
  private _canRedo = false;

  @property()
  mode: 'page' | 'edgeless' = 'page';

  @property()
  readonly = false;

  @state()
  private _hasOffset = false;

  @query('#block-type-dropdown')
  blockTypeDropdown!: SlDropdown;

  private _styleMenu!: GUI;
  private _showStyleDebugMenu = false;

  @state()
  private _showTabMenu = false;

  @state()
  private _dark = localStorage.getItem('blocksuite:dark') === 'true';

  get page() {
    return this.editor.page;
  }

  override createRenderRoot() {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    this._setThemeMode(this._dark && matchMedia.matches);
    matchMedia.addEventListener('change', this._darkModeChange);

    return this;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    matchMedia.removeEventListener('change', this._darkModeChange);
  }

  private _toggleConnection() {
    if (this._connected) {
      this.workspace.providers.forEach(provider => {
        if (!provider || !provider.disconnect) return;
        provider.disconnect();
      });
      this._connected = false;
    } else {
      this.workspace.providers.forEach(provider => {
        if (!provider || !provider.connect) return;
        provider.connect();
      });
      this._connected = true;
    }
  }

  private _updateBlockType(
    e: PointerEvent,
    flavour: 'affine:paragraph' | 'affine:list',
    type: string
  ) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    const blockRange = getCurrentBlockRange(this.page);
    if (!blockRange) {
      return;
    }
    updateBlockType(blockRange.models, flavour, type);
  }

  private _addCodeBlock(e: PointerEvent) {
    e.preventDefault();
    this.blockTypeDropdown.hide();

    const blockRange = getCurrentBlockRange(this.page);
    if (!blockRange) {
      throw new Error("Can't add code block without a selection");
    }
    const startModel = blockRange.models[0];
    const parent = this.page.getParent(startModel);
    const index = parent?.children.indexOf(startModel);
    const blockProps = {
      text: startModel.text?.clone(),
    };
    assertExists(parent);
    this.page.captureSync();
    this.page.deleteBlock(startModel);
    this.page.addBlock('affine:code', blockProps, parent, index);
  }

  private _switchEditorMode() {
    const editor = activeEditorManager.getActiveEditor();
    if (editor instanceof EditorContainer) {
      const mode = editor.mode === 'page' ? 'edgeless' : 'page';
      editor.mode = mode;
    } else {
      const mode = this.editor.mode === 'page' ? 'edgeless' : 'page';
      this.mode = mode;
    }
  }

  private _switchOffsetMode() {
    this._hasOffset = !this._hasOffset;
  }

  private _addFrame() {
    const root = this.page.root;
    if (!root) return;
    const pageId = root.id;

    this.page.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},720,480]`;

    const frameId = this.page.addBlock('affine:frame', { xywh }, pageId);
    this.page.addBlock('affine:paragraph', {}, frameId);
  }

  private _exportHtml() {
    this.contentParser.exportHtml();
  }

  private _exportMarkDown() {
    this.contentParser.exportMarkdown();
  }

  private _exportYDoc() {
    this.workspace.exportYDoc();
  }

  private async _importYDoc() {
    await this.workspace.importYDoc();
    this.requestUpdate();
  }

  private async _selectFile(accept: string): Promise<File> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = false;
    input.click();
    return new Promise((resolve, reject) => {
      input.onchange = () => {
        const file = input.files?.item(0);
        if (!file) {
          reject();
        }
        resolve(file as File);
      };
      input.onerror = () => {
        reject();
      };
    });
  }

  private async _importMarkDown() {
    const file = await this._selectFile('.md');
    const text = await file.text();
    const rootId = this.page.root?.id;
    rootId && (await this.contentParser.importMarkdown(text, rootId));
  }

  private async _importHtml() {
    const file = await this._selectFile('.html');
    const text = await file.text();
    const rootId = this.page.root?.id;
    rootId && (await this.contentParser.importHtml(text, rootId));
  }

  private async _importNotion() {
    const file = await this._selectFile('.zip');
    const zip = new JSZip();
    const zipFile = await zip.loadAsync(file);
    const pageMap = new Map<string, Page>();
    const files = Object.keys(zipFile.files);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lastSplitIndex = file.lastIndexOf('/');
      const fileName = file.substring(lastSplitIndex + 1);
      if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
        const page = this.page.workspace.createPage({
          init: {
            title: '',
          },
        });
        pageMap.set(file, page);
      }
    }
    pageMap.forEach(async (page, file) => {
      const lastSplitIndex = file.lastIndexOf('/');
      const folder = file.substring(0, lastSplitIndex) || '';
      const fileName = file.substring(lastSplitIndex + 1);
      if (fileName.endsWith('.html') || fileName.endsWith('.md')) {
        const isHtml = fileName.endsWith('.html');
        const rootId = page.root?.id;
        const fetchFileFunc = async (url: string) => {
          const fileName =
            folder + (folder ? '/' : '') + url.replaceAll('%20', ' ');
          return (await zipFile.file(fileName)?.async('blob')) || new Blob();
        };
        const contentParser = new window.ContentParser(page, fetchFileFunc);
        let text = (await zipFile.file(file)?.async('string')) || '';
        pageMap.forEach((value, key) => {
          const subPageLink = key.replaceAll(' ', '%20');
          text = isHtml
            ? text.replaceAll(
                `href="${subPageLink}"`,
                `href="${LINK_PRE + value.id}"`
              )
            : text.replaceAll(`(${subPageLink})`, `(${LINK_PRE + value.id})`);
        });
        if (rootId) {
          if (isHtml) {
            await contentParser.importHtml(text, rootId);
          } else {
            await contentParser.importMarkdown(text, rootId);
          }
        }
      }
    });
  }

  private async _inspect() {
    await createViewer(this.workspace.doc.toJSON());
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

  private _setThemeMode(dark: boolean) {
    const html = document.querySelector('html');

    this._dark = dark;
    localStorage.setItem('blocksuite:dark', dark ? 'true' : 'false');
    html?.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (dark) {
      html?.classList.add('dark');
      html?.classList.add('sl-theme-dark');
    } else {
      html?.classList.remove('dark');
      html?.classList.remove('sl-theme-dark');
    }
  }

  private _toggleDarkMode() {
    this._setThemeMode(!this._dark);
  }

  private _darkModeChange = (e: MediaQueryListEvent) => {
    this._setThemeMode(!!e.matches);
  };

  private _registerFormatBarCustomElements() {
    registerFormatBarCustomElement();
  }

  override firstUpdated() {
    this.workspace.slots.pageAdded.on(e => {
      this._showTabMenu = this.workspace.meta.pageMetas.length > 1;
    });
    this.workspace.slots.pageRemoved.on(() => {
      this._showTabMenu = this.workspace.meta.pageMetas.length > 1;
    });
    this.page.slots.historyUpdated.on(() => {
      this._canUndo = this.page.canUndo;
      this._canRedo = this.page.canRedo;
    });
    this._styleMenu = new GUI({ hideable: false });
    this._styleMenu.width = 650;
    const style = document.documentElement.style;
    init_css_debug_menu(this._styleMenu, style);
    this._styleMenu.hide();
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      const mode = this.mode;
      this.editor.mode = mode;
    }
    if (changedProperties.has('_hasOffset')) {
      const appRoot = document.getElementById('app');
      if (!appRoot) return;
      const style: Partial<CSSStyleDeclaration> = this._hasOffset
        ? {
            margin: '60px 40px 240px 40px',
            overflow: 'auto',
            height: '400px',
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
          }
        : {
            margin: '0',
            overflow: 'initial',
            // edgeless needs the container height
            height: '100%',
            boxShadow: 'initial',
          };
      Object.assign(appRoot.style, style);
    }
    super.update(changedProperties);
  }

  override render() {
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
          display: flex;
          gap: 5px;
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
                .disabled=${!this._canUndo}
                @click=${() => {
                  SelectionUtils.clearSelection(this.page);
                  this.page.undo();
                }}
              >
                <sl-icon name="arrow-counterclockwise" label="Undo"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <!-- redo -->
            <sl-tooltip content="Redo" placement="bottom" hoist>
              <sl-button
                size="small"
                content="Redo"
                .disabled=${!this._canRedo}
                @click=${() => {
                  SelectionUtils.clearSelection(this.page);
                  this.page.redo();
                }}
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
                  this._updateBlockType(e, 'affine:paragraph', 'text')}
              >
                Text
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h1')}
              >
                H1
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h2')}
              >
                H2
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h3')}
              >
                H3
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h4')}
              >
                H4
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h5')}
              >
                H5
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'h6')}
              >
                H6
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:paragraph', 'quote')}
              >
                Quote
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:list', 'bulleted')}
              >
                Bulleted List
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:list', 'numbered')}
              >
                Numbered List
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:list', 'todo')}
              >
                Todo List
              </sl-menu-item>
              <sl-menu-item
                @click=${(e: PointerEvent) =>
                  this._updateBlockType(e, 'affine:list', 'toggle')}
              >
                Toggle List
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
                ${this._connected ? 'Disconnect' : 'Connect'}
              </sl-menu-item>
              <sl-menu-item @click=${this._addFrame}> Add Frame</sl-menu-item>
              <sl-menu-item @click=${this._exportMarkDown}>
                Export Markdown
              </sl-menu-item>
              <sl-menu-item @click=${this._exportHtml}>
                Export HTML
              </sl-menu-item>
              <sl-menu-item @click=${this._exportYDoc}>
                Export YDoc
              </sl-menu-item>
              <sl-menu-item @click=${this._importYDoc}>
                Import YDoc
              </sl-menu-item>
              <sl-menu-item @click=${this._importMarkDown}>
                Import Markdown
              </sl-menu-item>
              <sl-menu-item @click=${this._importHtml}>
                Import Html
              </sl-menu-item>
              <sl-menu-item @click=${this._importNotion}>
                Import Notion
              </sl-menu-item>
              <sl-menu-item @click=${this._shareUrl}> Share URL</sl-menu-item>
              <sl-menu-item @click=${this._toggleStyleDebugMenu}>
                Toggle CSS Debug Menu
              </sl-menu-item>
              <sl-menu-item @click=${this._inspect}> Inspect Doc</sl-menu-item>
            </sl-menu>
          </sl-dropdown>

          <sl-tooltip
            content="Register FormatBar Custom Elements"
            placement="bottom"
            hoist
          >
            <sl-button
              size="small"
              content="Register FormatBar Custom Elements"
              @click=${this._registerFormatBarCustomElements}
            >
              <sl-icon name="plug"></sl-icon>
            </sl-button>
          </sl-tooltip>

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

          <sl-tooltip content="Toggle Dark Mode" placement="bottom" hoist>
            <sl-button size="small" @click=${this._toggleDarkMode}>
              <sl-icon
                name=${this._dark ? 'moon' : 'brightness-high'}
              ></sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-tooltip content="Add new page" placement="bottom" hoist>
            <sl-button
              size="small"
              content="Add New Page"
              @click=${() => createPage(this.workspace)}
            >
              <sl-icon name="file-earmark-plus"></sl-icon>
            </sl-button>
          </sl-tooltip>

          ${this._showTabMenu
            ? getTabGroupTemplate({
                workspace: this.workspace,
                editor: this.editor,
                requestUpdate: () => this.requestUpdate(),
              })
            : null}
        </div>
      </div>
    `;
  }
}

function createPage(workspace: Workspace) {
  const id = workspace.idGenerator();
  workspace.createPage({ id, init: true });
}

function getTabGroupTemplate({
  workspace,
  editor,
  requestUpdate,
}: {
  workspace: Workspace;
  editor: EditorContainer;
  requestUpdate: () => void;
}) {
  workspace.slots.pagesUpdated.on(requestUpdate);
  const pageList = workspace.meta.pageMetas;
  editor.slots.pageLinkClicked.on(({ pageId }) => {
    const tabGroup = document.querySelector<SlTabGroup>('.tabs-closable');
    if (!tabGroup) throw new Error('tab group not found');
    tabGroup.show(pageId);
  });

  return html`<sl-tab-group
    class="tabs-closable"
    style="display: flex; overflow: hidden;"
    @sl-tab-show=${(e: CustomEvent<{ name: string }>) => {
      const otherPage = workspace.getPage(e.detail.name);
      if (!otherPage) throw new Error('page not found');
      editor.page = otherPage;
    }}
  >
    ${pageList.map(
      page =>
        html`<sl-tab
          slot="nav"
          panel="${page.id}"
          ?active=${page.id === editor.page.id}
          ?closable=${pageList.length > 1}
          @sl-close=${(e: CustomEvent) => {
            const tab = e.target;
            // Show other tab if the tab is currently active
            if (tab && (tab as SlTab).active) {
              const tabGroup =
                document.querySelector<SlTabGroup>('.tabs-closable');
              if (!tabGroup) throw new Error('tab group not found');
              const otherPage = pageList.find(
                metaPage => page.id !== metaPage.id
              );
              if (!otherPage) throw new Error('no other page found');
              tabGroup.show(otherPage.id);
            }
            workspace.removePage(page.id);
          }}
        >
          <div>
            <div>${page.title || 'Untitled'}</div>
            <!-- TODO deprecated subpage -->
            <div>
              ${page.subpageIds
                .map(
                  pageId =>
                    (
                      pageList.find(meta => meta.id === pageId) ?? {
                        title: 'Page Not Found',
                      }
                    ).title || 'Untitled'
                )
                .join(',')}
            </div>
          </div>
        </sl-tab>`
    )}
  </sl-tab-group>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-menu': DebugMenu;
  }
}
