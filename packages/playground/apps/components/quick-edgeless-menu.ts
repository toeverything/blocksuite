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
import '@shoelace-style/shoelace/dist/components/input/input.js';

import type { AffineTextAttributes } from '@blocksuite/blocks';
import {
  ColorVariables,
  extractCssVariables,
  type PageService,
} from '@blocksuite/blocks';
import type { DeltaInsert } from '@blocksuite/inline';
import { ShadowlessElement } from '@blocksuite/lit';
import type { AffineEditorContainer } from '@blocksuite/presets';
import { Text, Utils, type Workspace } from '@blocksuite/store';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { notify } from '../default/utils/notify.js';
import { generateRoomId } from '../sync/websocket/utils.js';
import type { LeftSidePanel } from './left-side-panel.js';
import type { PagesPanel } from './pages-panel.js';

const cssVariablesMap = extractCssVariables(document.documentElement);
const plate: Record<string, string> = {};
ColorVariables.forEach((key: string) => {
  plate[key] = cssVariablesMap[key];
});

const basePath = import.meta.env.DEV
  ? 'node_modules/@shoelace-style/shoelace/dist'
  : 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.11.2/dist/';
setBasePath(basePath);

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
  editor!: AffineEditorContainer;
  @property({ attribute: false })
  leftSidePanel!: LeftSidePanel;
  @property({ attribute: false })
  pagesPanel!: PagesPanel;

  @state()
  private _canUndo = false;

  @state()
  private _canRedo = false;

  @property({ attribute: false })
  mode: 'page' | 'edgeless' = 'page';

  @property({ attribute: false })
  readonly = false;

  @state()
  private _dark = localStorage.getItem('blocksuite:dark') === 'true';

  get page() {
    return this.editor.page;
  }

  get pageService() {
    return this.editor.host.spec.getService('affine:page') as PageService;
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
    const xywh = `[0,${count * 60},800,95]`;

    const noteId = this.page.addBlock('affine:note', { xywh }, pageId);
    this.page.addBlock('affine:paragraph', {}, noteId);
  }

  private _exportPdf() {
    this.pageService.exportManager.exportPdf().catch(console.error);
  }

  private _exportHtml() {
    const htmlTransformer = this.pageService.transformers.html;
    htmlTransformer.exportPage(this.page).catch(console.error);
  }

  private _exportMarkDown() {
    const markdownTransformer = this.pageService.transformers.markdown;
    markdownTransformer.exportPage(this.page).catch(console.error);
  }

  private _exportPng() {
    this.pageService.exportManager.exportPng().catch(console.error);
  }

  private async _exportSnapshot() {
    const zipTransformer = this.pageService.transformers.zip;
    const file = await zipTransformer.exportPages(this.workspace, [this.page]);
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
        const zipTransformer = this.pageService.transformers.zip;
        const pages = await zipTransformer.importPages(this.workspace, file);
        for (const page of pages) {
          const noteBlock = window.page.getBlockByFlavour('affine:note');
          window.page.addBlock(
            'affine:paragraph',
            {
              type: 'text',
              text: new Text([
                {
                  insert: ' ',
                  attributes: {
                    reference: {
                      type: 'LinkedPage',
                      pageId: page.id,
                    },
                  },
                } as DeltaInsert<AffineTextAttributes>,
              ]),
            },
            noteBlock[0].id
          );
        }
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
    if (window.wsProvider) {
      notify('There is already a websocket provider exists', 'neutral').catch(
        console.error
      );
      return;
    }

    const params = new URLSearchParams(location.search);
    const id = params.get('room') || (await generateRoomId());

    params.set('room', id);
    const url = new URL(location.href);
    url.search = params.toString();
    location.href = url.href;
  };
  private _togglePagesPanel() {
    this.leftSidePanel.toggle(this.pagesPanel);
  }

  override firstUpdated() {
    this.page.slots.historyUpdated.on(() => {
      this._canUndo = this.page.canUndo;
      this._canRedo = this.page.canRedo;
    });
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
      <div class="quick-edgeless-menu default blocksuite-overlay">
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
                <sl-menu-item>
                  <sl-icon
                    slot="prefix"
                    name="terminal"
                    label="Test operations"
                  ></sl-icon>
                  <span>Test operations</span>
                  <sl-menu slot="submenu">
                    <sl-menu-item @click=${this._addNote}>
                      Add Note</sl-menu-item
                    >
                    <sl-menu-item @click=${this._exportMarkDown}>
                      Export Markdown
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
                  </sl-menu>
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
                    GitHub
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

            <sl-tooltip content="Start Collaboration" placement="bottom" hoist>
              <sl-button @click=${this._startCollaboration} size="small" circle>
                <sl-icon name="people" label="Collaboration"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <sl-tooltip content="Pages" placement="bottom" hoist>
              <sl-button @click=${this._togglePagesPanel} size="small" circle>
                <sl-icon name="filetype-doc" label="Page"></sl-icon>
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
