import type { SerializedXYWH } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline';
import type { AffineEditorContainer } from '@blocksuite/presets';

import { ShadowlessElement } from '@blocksuite/block-std';
import {
  type AffineTextAttributes,
  type DocMode,
  DocModeProvider,
  ExportManager,
} from '@blocksuite/blocks';
import { EdgelessRootService, printToPdf } from '@blocksuite/blocks';
import { type DocCollection, Text } from '@blocksuite/store';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { DocsPanel } from './docs-panel.js';
import type { LeftSidePanel } from './left-side-panel.js';

import { notify } from '../../default/utils/notify.js';
import { generateRoomId } from '../sync/websocket/utils.js';

const basePath =
  'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.11.2/dist/';
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

  private _darkModeChange = (e: MediaQueryListEvent) => {
    this._setThemeMode(!!e.matches);
  };

  private _keydown = (e: KeyboardEvent) => {
    if (e.key === 'F1') {
      this._switchEditorMode();
    }
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

  get doc() {
    return this.editor.doc;
  }

  get editorMode() {
    return this.editor.mode;
  }

  set editorMode(value: DocMode) {
    this.editor.mode = value;
  }

  get rootService() {
    try {
      return this.editor.std.getService('affine:page');
    } catch {
      return null;
    }
  }

  private _addNote() {
    const rootModel = this.doc.root;
    if (!rootModel) return;
    const rootId = rootModel.id;

    this.doc.captureSync();

    const count = rootModel.children.length;
    const xywh: SerializedXYWH = `[0,${count * 60},800,95]`;

    const noteId = this.doc.addBlock('affine:note', { xywh }, rootId);
    this.doc.addBlock('affine:paragraph', {}, noteId);
  }

  private async _clearSiteData() {
    await fetch('/Clear-Site-Data');
    window.location.reload();
  }

  private _exportHtml() {
    const htmlTransformer = this.rootService?.transformers.html;
    htmlTransformer?.exportDoc(this.doc).catch(console.error);
  }

  private _exportMarkDown() {
    const markdownTransformer = this.rootService?.transformers.markdown;
    markdownTransformer?.exportDoc(this.doc).catch(console.error);
  }

  private _exportPdf() {
    this.editor.std.get(ExportManager).exportPdf().catch(console.error);
  }

  private _exportPng() {
    this.editor.std.get(ExportManager).exportPng().catch(console.error);
  }

  private async _exportSnapshot() {
    if (!this.rootService) return;
    const zipTransformer = this.rootService.transformers.zip;
    const file = await zipTransformer.exportDocs(
      this.collection,
      [...this.collection.docs.values()].map(collection => collection.getDoc())
    );
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${this.doc.id}.bs.zip`);
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
      if (!file) return;
      if (!this.rootService) return;
      try {
        const zipTransformer = this.rootService.transformers.zip;
        const docs = await zipTransformer.importDocs(this.collection, file);
        for (const doc of docs) {
          let noteBlockId;
          const noteBlocks = window.doc.getBlocksByFlavour('affine:note');
          if (noteBlocks.length) {
            noteBlockId = noteBlocks[0].id;
          } else {
            noteBlockId = this.doc.addBlock(
              'affine:note',
              {
                xywh: '[-200,-48,400,96]',
              },
              this.doc.root?.id
            );
          }

          if (!doc) {
            break;
          }

          window.doc.addBlock(
            'affine:paragraph',
            {
              type: 'text',
              text: new Text([
                {
                  insert: ' ',
                  attributes: {
                    reference: {
                      type: 'LinkedPage',
                      pageId: doc.id,
                    },
                  },
                } as DeltaInsert<AffineTextAttributes>,
              ]),
            },
            noteBlockId
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

  private _insertTransitionStyle(classKey: string, duration: number) {
    const $html = document.documentElement;
    const $style = document.createElement('style');
    const slCSSKeys = ['sl-transition-x-fast'];
    $style.innerHTML = `html.${classKey} * { transition: all ${duration}ms 0ms linear !important; } :root { ${slCSSKeys.map(
      key => `--${key}: ${duration}ms`
    )} }`;

    $html.append($style);
    $html.classList.add(classKey);

    setTimeout(() => {
      $style.remove();
      $html.classList.remove(classKey);
    }, duration);
  }

  private _print() {
    printToPdf().catch(console.error);
  }

  private _setThemeMode(dark: boolean) {
    const html = document.querySelector('html');

    this._dark = dark;
    localStorage.setItem('blocksuite:dark', dark ? 'true' : 'false');
    if (!html) return;
    html.dataset.theme = dark ? 'dark' : 'light';

    this._insertTransitionStyle('color-transition', 0);

    if (dark) {
      html.classList.add('dark');
      html.classList.add('sl-theme-dark');
    } else {
      html.classList.remove('dark');
      html.classList.remove('sl-theme-dark');
    }
  }

  private _switchEditorMode() {
    if (!this.editor.host) return;
    const newMode = this._docMode === 'page' ? 'edgeless' : 'page';
    const docModeService = this.editor.host.std.get(DocModeProvider);
    if (docModeService) {
      docModeService.setPrimaryMode(newMode, this.editor.doc.id);
    }
    this._docMode = newMode;
    this.editor.mode = newMode;
  }

  private _toggleDarkMode() {
    this._setThemeMode(!this._dark);
  }

  private _toggleDocsPanel() {
    this.leftSidePanel.toggle(this.docsPanel);
  }

  override connectedCallback() {
    super.connectedCallback();

    this._docMode = this.editor.mode;
    this.editor.slots.docUpdated.on(({ newDocId }) => {
      const newDocMode = this.editor.std
        .get(DocModeProvider)
        .getPrimaryMode(newDocId);
      this._docMode = newDocMode;
    });

    document.body.addEventListener('keydown', this._keydown);
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
    document.body.removeEventListener('keydown', this._keydown);
  }

  override firstUpdated() {
    this.doc.slots.historyUpdated.on(() => {
      this._canUndo = this.doc.canUndo;
      this._canRedo = this.doc.canRedo;
    });
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
                <sl-menu-item>
                  <sl-icon
                    slot="prefix"
                    name="terminal"
                    label="Test operations"
                  ></sl-icon>
                  <span>Test operations</span>
                  <sl-menu slot="submenu">
                    <sl-menu-item @click="${this._print}"> Print </sl-menu-item>
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
                  </sl-menu>
                </sl-menu-item>
                <sl-menu-item @click=${this._clearSiteData}>
                  Clear Site Data
                  <sl-icon slot="prefix" name="trash"></sl-icon>
                </sl-menu-item>
                <sl-menu-item @click=${this._toggleDarkMode}>
                  Toggle ${this._dark ? 'Light' : 'Dark'} Mode
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
                    this.doc.undo();
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
                    this.doc.redo();
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
            <sl-tooltip content="Docs" placement="bottom" hoist>
              <sl-button @click=${this._toggleDocsPanel} size="small" circle>
                <sl-icon name="filetype-doc" label="Doc"></sl-icon>
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
                        this.collection.awarenessStore.awareness.setLocalStateField(
                          'user',
                          {
                            name: (e.target as HTMLInputElement).value ?? '',
                          }
                        );
                      } else {
                        this.collection.awarenessStore.awareness.setLocalStateField(
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

          <div style="display: flex; gap: 12px">
            <!-- Present button -->
            ${this._docMode === 'edgeless'
              ? html`<sl-tooltip content="Present" placement="bottom" hoist>
                  <sl-button
                    size="small"
                    circle
                    @click=${() => {
                      if (this.rootService instanceof EdgelessRootService) {
                        this.rootService.tool.setEdgelessTool({
                          type: 'frameNavigator',
                        });
                      }
                    }}
                  >
                    <sl-icon name="easel" label="Present"></sl-icon>
                  </sl-button>
                </sl-tooltip>`
              : nothing}
            <sl-button-group label="Mode" style="margin-right: 12px">
              <!-- switch to page -->
              <sl-tooltip content="Page" placement="bottom" hoist>
                <sl-button
                  pill
                  size="small"
                  content="Page"
                  .disabled=${this._docMode !== 'edgeless'}
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
                  .disabled=${this._docMode !== 'page'}
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

  @state()
  private accessor _canRedo = false;

  @state()
  private accessor _canUndo = false;

  @state()
  private accessor _dark = localStorage.getItem('blocksuite:dark') === 'true';

  @state()
  private accessor _docMode: DocMode = 'page';

  @property({ attribute: false })
  accessor collection!: DocCollection;

  @property({ attribute: false })
  accessor docsPanel!: DocsPanel;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor leftSidePanel!: LeftSidePanel;

  @property({ attribute: false })
  accessor readonly = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'quick-edgeless-menu': QuickEdgelessMenu;
  }
}
