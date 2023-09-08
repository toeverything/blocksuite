/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';

import {
  COLOR_VARIABLES,
  extractCssVariables,
  FONT_FAMILY_VARIABLES,
  SIZE_VARIABLES,
  VARIABLES,
} from '@blocksuite/blocks';
import { EDITOR_WIDTH } from '@blocksuite/blocks';
import type { ContentParser } from '@blocksuite/blocks/content-parser';
import type { EditorContainer } from '@blocksuite/editor';
import { ShadowlessElement } from '@blocksuite/lit';
import {
  exportPagesZip,
  importPagesZip,
  Job,
  MarkdownAdapter,
  Utils,
  type Workspace,
} from '@blocksuite/store';
import type { SlDropdown, SlTab, SlTabGroup } from '@shoelace-style/shoelace';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Pane } from 'tweakpane';

import {
  generateRoomId,
  initCollaborationSocket,
} from '../providers/websocket-channel';
import { notify } from '../utils/notify';

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

function init_css_debug_menu(styleMenu: Pane) {
  if (styleMenu.title !== 'Waiting') {
    return;
  }
  const style = document.documentElement.style;
  styleMenu.title = 'CSS Debug Menu';
  const sizeFolder = styleMenu.addFolder({ title: 'Size', expanded: false });
  const fontFamilyFolder = styleMenu.addFolder({
    title: 'Font Family',
    expanded: false,
  });
  const colorFolder = styleMenu.addFolder({ title: 'Color', expanded: false });
  const othersFolder = styleMenu.addFolder({
    title: 'Others',
    expanded: false,
  });
  SIZE_VARIABLES.forEach(name => {
    sizeFolder
      .addInput(
        {
          [name]: isNaN(parseFloat(cssVariablesMap[name]))
            ? 0
            : parseFloat(cssVariablesMap[name]),
        },
        name,
        {
          min: 0,
          max: 100,
        }
      )
      .on('change', e => {
        style.setProperty(name, `${Math.round(e.value)}px`);
      });
  });
  FONT_FAMILY_VARIABLES.forEach(name => {
    fontFamilyFolder
      .addInput(
        {
          [name]: cssVariablesMap[name],
        },
        name
      )
      .on('change', e => {
        style.setProperty(name, e.value);
      });
  });
  OTHER_CSS_VARIABLES.forEach(name => {
    othersFolder
      .addInput({ [name]: cssVariablesMap[name] }, name)
      .on('change', e => {
        style.setProperty(name, e.value);
      });
  });
  fontFamilyFolder
    .addInput(
      {
        '--affine-font-family':
          'Roboto Mono, apple-system, BlinkMacSystemFont,Helvetica Neue, Tahoma, PingFang SC, Microsoft Yahei, Arial,Hiragino Sans GB, sans-serif, Apple Color Emoji, Segoe UI Emoji,Segoe UI Symbol, Noto Color Emoji',
      },
      '--affine-font-family'
    )
    .on('change', e => {
      style.setProperty('--affine-font-family', e.value);
    });
  for (const plateKey in plate) {
    colorFolder.addInput(plate, plateKey).on('change', e => {
      style.setProperty(plateKey, e.value);
    });
  }
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
  workspace.meta.pageMetasUpdated.on(requestUpdate);
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
      if (otherPage) {
        editor.page = otherPage;
      }
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
          </div>
        </sl-tab>`
    )}
  </sl-tab-group>`;
}

@customElement('quick-edgeless-menu')
export class QuickEdgelessMenu extends ShadowlessElement {
  static override styles = css`
    :root {
      --sl-font-size-medium: var(--affine-font-xs);
      --sl-input-font-size-small: var(--affine-font-xs);
    }

    .dg.ac {
      z-index: 1001 !important;
    }

    .top-container {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
    }
  `;

  @property({ attribute: false })
  workspace!: Workspace;

  @property({ attribute: false })
  editor!: EditorContainer;

  @property({ attribute: false })
  contentParser!: ContentParser;

  @state()
  private _connected = true;

  @state()
  private _canUndo = false;

  @state()
  private _canRedo = false;

  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  readonly = false;

  @query('#test-operations-dropdown')
  testOperationsDropdown!: SlDropdown;

  private _styleMenu!: Pane;
  private _showStyleDebugMenu = false;

  @state()
  private _showTabMenu = false;

  @state()
  private _dark = localStorage.getItem('blocksuite:dark') === 'true';

  @state()
  private _initws = false;

  get page() {
    return this.editor.page;
  }

  override createRenderRoot() {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    this._setThemeMode(this._dark && matchMedia.matches);
    matchMedia.addEventListener('change', this._darkModeChange);

    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.body.addEventListener('keydown', this._keydown);
    this._restoreMode();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    matchMedia.removeEventListener('change', this._darkModeChange);
    document.body.removeEventListener('keydown', this._keydown);
  }

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'F1') {
      this._switchEditorMode();
    }
  };

  private _toggleConnection() {
    if (this._connected) {
      this.workspace.providers.forEach(provider => {
        if ('passive' in provider && provider.connected) {
          provider.disconnect();
        }
      });
      this._connected = false;
    } else {
      this.workspace.providers.forEach(provider => {
        if ('passive' in provider && !provider.connected) {
          provider.connect();
        }
      });
      this._connected = true;
    }
  }

  private _switchEditorMode() {
    const mode = this.editor.mode === 'page' ? 'edgeless' : 'page';
    localStorage.setItem('playground:editorMode', mode);
    this.mode = mode;
  }

  private _restoreMode() {
    const mode = localStorage.getItem('playground:editorMode');
    if (mode && (mode === 'edgeless' || mode === 'page')) {
      this.mode = mode;
    }
  }

  private _addNote() {
    const root = this.page.root;
    if (!root) return;
    const pageId = root.id;

    this.page.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},${EDITOR_WIDTH},95]`;

    const noteId = this.page.addBlock('affine:note', { xywh }, pageId);
    this.page.addBlock('affine:paragraph', {}, noteId);
  }

  private _exportPdf() {
    this.contentParser.exportPdf();
  }

  private _exportHtml() {
    this.contentParser.exportHtml();
  }

  private _exportMarkDown() {
    this.contentParser.exportMarkdown();
  }

  private _exportMarkDownExperimentalAdapter() {
    const job = new Job({
      workspace: this.workspace,
    });
    job.pageToSnapshot(window.page).then(snapshot => {
      new MarkdownAdapter()
        .fromPageSnapshot({
          snapshot,
          assets: job.assetsManager,
        })
        .then(markdown => {
          const blob = new Blob([markdown], { type: 'plain/text' });
          const fileURL = URL.createObjectURL(blob);
          const element = document.createElement('a');
          element.setAttribute('href', fileURL);
          element.setAttribute('download', 'export.md');
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          URL.revokeObjectURL(fileURL);
        });
    });
  }

  private _exportPng() {
    this.contentParser.exportPng();
  }

  private async _exportSnapshot() {
    const file = await exportPagesZip(this.workspace, [this.page]);
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${this.page.id}.bs.zip`);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private _importSnapshot() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.zip');
    input.multiple = false;
    input.onchange = async () => {
      const file = input.files?.item(0);
      if (!file) {
        return;
      }
      try {
        await importPagesZip(this.workspace, file);
        this.requestUpdate();
      } catch (e) {
        console.error('Invalid snapshot.');
        console.error(e);
      } finally {
        input.remove();
      }
    };
    input.click();
  }

  private _shareUrl() {
    const base64 = Utils.encodeWorkspaceAsYjsUpdateV2(this.workspace);
    const url = new URL(window.location.toString());
    url.searchParams.set('init', base64);
    window.history.pushState({}, '', url);
  }

  private _toggleStyleDebugMenu() {
    init_css_debug_menu(this._styleMenu);
    this._showStyleDebugMenu = !this._showStyleDebugMenu;
    this._showStyleDebugMenu
      ? (this._styleMenu.hidden = false)
      : (this._styleMenu.hidden = true);
  }

  private _setThemeMode(dark: boolean) {
    const html = document.querySelector('html');

    this._dark = dark;
    localStorage.setItem('blocksuite:dark', dark ? 'true' : 'false');
    if (!html) return;
    html.setAttribute('data-theme', dark ? 'dark' : 'light');

    this._insertTransitionStyle('color-transition', 0);

    if (dark) {
      html.classList.add('dark');
      html.classList.add('sl-theme-dark');
    } else {
      html.classList.remove('dark');
      html.classList.remove('sl-theme-dark');
    }
  }

  private _insertTransitionStyle(classKey: string, duration: number) {
    const $html = document.documentElement;
    const $style = document.createElement('style');
    const slCSSKeys = ['sl-transition-x-fast'];
    $style.innerHTML = `html.${classKey} * { transition: all ${duration}ms 0ms linear !important; } :root { ${slCSSKeys.map(
      key => `--${key}: ${duration}ms`
    )} }`;

    $html.appendChild($style);
    $html.classList.add(classKey);

    setTimeout(() => {
      $style.remove();
      $html.classList.remove(classKey);
    }, duration);
  }

  private _toggleDarkMode() {
    this._setThemeMode(!this._dark);
  }

  private _darkModeChange = (e: MediaQueryListEvent) => {
    this._setThemeMode(!!e.matches);
  };

  private _startCollaboration = async () => {
    if (
      this.workspace.providers.find(
        provider => provider.flavour === 'websocket-channel'
      )
    ) {
      notify('There is already a websocket provider exists', 'neutral');
      return;
    }

    this._initws = true;

    const params = new URLSearchParams(location.search);
    const id = params.get('room') || (await generateRoomId());
    const success = await this._initWebsocketProvider(id);

    if (success) {
      history.replaceState({}, '', `?room=${id}`);
      this.requestUpdate();
    }
  };

  private async _initWebsocketProvider(room: string): Promise<boolean> {
    this._initws = true;
    const result = await initCollaborationSocket(this.workspace, room);
    this._initws = false;
    return result;
  }

  override firstUpdated() {
    this._showTabMenu = this.workspace.meta.pageMetas.length > 1;
    this.workspace.slots.pageAdded.on(() => {
      this._showTabMenu = this.workspace.meta.pageMetas.length > 1;
    });
    this.workspace.slots.pageRemoved.on(() => {
      this._showTabMenu = this.workspace.meta.pageMetas.length > 1;
    });
    this.page.slots.historyUpdated.on(() => {
      this._canUndo = this.page.canUndo;
      this._canRedo = this.page.canRedo;
    });
    this._styleMenu = new Pane({ title: 'Waiting' });
    this._styleMenu.hidden = true;
    this._styleMenu.element.style.width = '650';
  }

  override update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mode')) {
      const mode = this.mode;
      this.editor.mode = mode;
    }

    super.update(changedProperties);
  }

  override render() {
    return html`
      <style>
        .quick-edgeless-menu {
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

        @media print {
          .quick-edgeless-menu {
            display: none;
          }
        }

        .default-toolbar {
          display: flex;
          gap: 5px;
          padding: 8px 8px 8px 16px;
          width: 100%;
          min-width: 390px;
          align-items: center;
          justify-content: space-between;
        }

        .default-toolbar sl-button.dots-menu::part(base) {
          color: var(--sl-color-neutral-700);
        }

        .default-toolbar sl-button.dots-menu::part(label) {
          padding-left: 0;
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
      <div class="quick-edgeless-menu default">
        <div class="default-toolbar">
          <div class="top-container">
            <sl-dropdown placement="bottom" hoist>
              <sl-button
                class="dots-menu"
                variant="text"
                size="small"
                slot="trigger"
              >
                <sl-icon
                  style="font-size: 14px"
                  name="three-dots-vertical"
                  label="Menu"
                ></sl-icon>
              </sl-button>
              <sl-menu>
                <sl-menu-item
                  @mouseenter=${() => this.testOperationsDropdown.show()}
                  @mouseleave=${() => this.testOperationsDropdown.hide()}
                >
                  <sl-icon
                    slot="prefix"
                    name="terminal"
                    label="Test operations"
                  ></sl-icon>
                  <sl-dropdown
                    id="test-operations-dropdown"
                    placement="right-start"
                    .distance=${40.5}
                    hoist
                  >
                    <span slot="trigger">Test operations</span>
                    <sl-menu>
                      <sl-menu-item @click=${this._toggleConnection}>
                        ${this._connected ? 'Disconnect' : 'Connect'}
                      </sl-menu-item>
                      <sl-menu-item @click=${this._addNote}>
                        Add Note</sl-menu-item
                      >
                      <sl-menu-item @click=${this._exportMarkDown}>
                        Export Markdown
                      </sl-menu-item>
                      <sl-menu-item
                        @click=${this._exportMarkDownExperimentalAdapter}
                      >
                        Export Markdown (Experimental Adapter)
                      </sl-menu-item>
                      <sl-menu-item @click=${this._exportHtml}>
                        Export HTML
                      </sl-menu-item>
                      <sl-menu-item @click=${this._exportPdf}>
                        Export PDF
                      </sl-menu-item>
                      <sl-menu-item @click=${this._exportPng}>
                        Export PNG
                      </sl-menu-item>
                      <sl-menu-item @click=${this._exportSnapshot}>
                        Export Snapshot
                      </sl-menu-item>
                      <sl-menu-item @click=${this._importSnapshot}>
                        Import Snapshot
                      </sl-menu-item>
                      <sl-menu-item @click=${this._shareUrl}>
                        Share URL</sl-menu-item
                      >
                      <sl-menu-item @click=${this._toggleStyleDebugMenu}>
                        Toggle CSS Debug Menu
                      </sl-menu-item>
                    </sl-menu>
                  </sl-dropdown>
                </sl-menu-item>
                <sl-menu-item @click=${this._toggleDarkMode}>
                  Toggle Dark Mode
                  <sl-icon
                    slot="prefix"
                    name=${this._dark ? 'moon' : 'brightness-high'}
                  ></sl-icon>
                </sl-menu-item>
                <sl-divider></sl-divider>
                <a
                  target="_blank"
                  href="https://github.com/toeverything/blocksuite"
                >
                  <sl-menu-item>
                    <sl-icon slot="prefix" name="github"></sl-icon>
                    Github
                  </sl-menu-item>
                </a>
              </sl-menu>
            </sl-dropdown>

            <!-- undo/redo group -->
            <sl-button-group label="History">
              <!-- undo -->
              <sl-tooltip content="Undo" placement="bottom" hoist>
                <sl-button
                  pill
                  size="small"
                  content="Undo"
                  .disabled=${!this._canUndo}
                  @click=${() => {
                    this.page.undo();
                  }}
                >
                  <sl-icon name="arrow-counterclockwise" label="Undo"></sl-icon>
                </sl-button>
              </sl-tooltip>
              <!-- redo -->
              <sl-tooltip content="Redo" placement="bottom" hoist>
                <sl-button
                  pill
                  size="small"
                  content="Redo"
                  .disabled=${!this._canRedo}
                  @click=${() => {
                    this.page.redo();
                  }}
                >
                  <sl-icon name="arrow-clockwise" label="Redo"></sl-icon>
                </sl-button>
              </sl-tooltip>
            </sl-button-group>

            <sl-tooltip content="Start collaboration" placement="bottom" hoist>
              <sl-button
                @click=${this._startCollaboration}
                size="small"
                .loading=${this._initws}
                circle
              >
                <sl-icon name="people" label="Collaboration"></sl-icon>
              </sl-button>
            </sl-tooltip>

            ${new URLSearchParams(location.search).get('room')
              ? html`<sl-tooltip
                  content="Your name in Collaboration (default: Unknown)"
                  placement="bottom"
                  hoist
                  ><sl-input
                    placeholder="Unknown"
                    clearable
                    size="small"
                    @blur=${(e: Event) => {
                      if ((e.target as HTMLInputElement).value.length > 0) {
                        this.workspace.awarenessStore.awareness.setLocalStateField(
                          'user',
                          {
                            name: (e.target as HTMLInputElement).value ?? '',
                          }
                        );
                      } else {
                        this.workspace.awarenessStore.awareness.setLocalStateField(
                          'user',
                          {
                            name: 'Unknown',
                          }
                        );
                      }
                    }}
                  ></sl-input
                ></sl-tooltip>`
              : nothing}
          </div>

          <div>
            <sl-button-group label="Mode" style="margin-right: 12px">
              <!-- switch to page -->
              <sl-tooltip content="Page" placement="bottom" hoist>
                <sl-button
                  pill
                  size="small"
                  content="Page"
                  .disabled=${this.mode !== 'edgeless'}
                  @click=${this._switchEditorMode}
                >
                  <sl-icon name="filetype-doc" label="Page"></sl-icon>
                </sl-button>
              </sl-tooltip>
              <!-- switch to edgeless -->
              <sl-tooltip content="Edgeless" placement="bottom" hoist>
                <sl-button
                  pill
                  size="small"
                  content="Edgeless"
                  .disabled=${this.mode !== 'page'}
                  @click=${this._switchEditorMode}
                >
                  <sl-icon name="palette" label="Edgeless"></sl-icon>
                </sl-button>
              </sl-tooltip>
            </sl-button-group>

            ${this._showTabMenu
              ? getTabGroupTemplate({
                  workspace: this.workspace,
                  editor: this.editor,
                  requestUpdate: () => this.requestUpdate(),
                })
              : null}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'quick-edgeless-menu': QuickEdgelessMenu;
  }
}
