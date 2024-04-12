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
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import './left-side-panel.js';
import './side-panel.js';

import { type EditorHost, ShadowlessElement } from '@blocksuite/block-std';
import type {
  AffineTextAttributes,
  SerializedXYWH,
  TreeNode,
} from '@blocksuite/blocks';
import {
  BlocksUtils,
  ColorVariables,
  extractCssVariables,
  FontFamilyVariables,
  HtmlTransformer,
  MarkdownTransformer,
  SizeVariables,
  StyleVariables,
  type SurfaceBlockComponent,
  ZipTransformer,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { DeltaInsert } from '@blocksuite/inline/types';
import type {
  AffineEditorContainer,
  CommentPanel,
  CopilotPanel,
} from '@blocksuite/presets';
import type { BlockModel } from '@blocksuite/store';
import { type DocCollection, Text, Utils } from '@blocksuite/store';
import type { SlDropdown } from '@shoelace-style/shoelace';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import * as lz from 'lz-string';
import type { Pane } from 'tweakpane';

import { getEdgelessService } from '../../../../presets/src/fragments/copilot-panel/utils/selection-utils.js';
import type { CustomChatPanel } from './custom-chat-panel.js';
import type { CustomFramePanel } from './custom-frame-panel.js';
import type { CustomOutlinePanel } from './custom-outline-panel.js';
import type { DocsPanel } from './docs-panel.js';
import type { LeftSidePanel } from './left-side-panel.js';
import type { SidePanel } from './side-panel.js';

const basePath = import.meta.env.DEV
  ? '/node_modules/@shoelace-style/shoelace/dist'
  : 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.11.2/dist';
setBasePath(basePath);

export function getSurfaceElementFromEditor(editorHost: EditorHost) {
  const { doc } = editorHost;
  const surfaceModel = doc.getBlockByFlavour('affine:surface')[0];
  assertExists(surfaceModel);

  const surfaceId = surfaceModel.id;
  const surfaceElement = editorHost.querySelector(
    `affine-surface[data-block-id="${surfaceId}"]`
  ) as SurfaceBlockComponent;
  assertExists(surfaceElement);

  return surfaceElement;
}

const cssVariablesMap = extractCssVariables(document.documentElement);
const plate: Record<string, string> = {};
ColorVariables.forEach((key: string) => {
  plate[key] = cssVariablesMap[key];
});
const OTHER_CSS_VARIABLES = StyleVariables.filter(
  variable =>
    !SizeVariables.includes(variable) &&
    !ColorVariables.includes(variable) &&
    !FontFamilyVariables.includes(variable)
);
let styleDebugMenuLoaded = false;

function initStyleDebugMenu(styleMenu: Pane, style: CSSStyleDeclaration) {
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
  SizeVariables.forEach(name => {
    sizeFolder
      .addBinding(
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
  FontFamilyVariables.forEach(name => {
    fontFamilyFolder
      .addBinding(
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
      .addBinding({ [name]: cssVariablesMap[name] }, name)
      .on('change', e => {
        style.setProperty(name, e.value);
      });
  });
  fontFamilyFolder
    .addBinding(
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
    colorFolder.addBinding(plate, plateKey).on('change', e => {
      style.setProperty(plateKey, e.value);
    });
  }
}

function getDarkModeConfig(): boolean {
  const updatedDarkModeConfig = localStorage.getItem('blocksuite:dark');
  if (updatedDarkModeConfig !== null) {
    return updatedDarkModeConfig === 'true';
  }

  const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
  return matchMedia.matches;
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

  @property({ attribute: false })
  collection!: DocCollection;

  @property({ attribute: false })
  editor!: AffineEditorContainer;

  @property({ attribute: false })
  outlinePanel!: CustomOutlinePanel;

  @property({ attribute: false })
  framePanel!: CustomFramePanel;

  @property({ attribute: false })
  chatPanel!: CustomChatPanel;

  @property({ attribute: false })
  copilotPanel!: CopilotPanel;

  @property({ attribute: false })
  commentPanel!: CommentPanel;

  @property({ attribute: false })
  sidePanel!: SidePanel;
  @property({ attribute: false })
  leftSidePanel!: LeftSidePanel;
  @property({ attribute: false })
  docsPanel!: DocsPanel;

  @state()
  private _canUndo = false;

  @state()
  private _canRedo = false;

  @property({ attribute: false })
  readonly = false;

  @state()
  private _hasOffset = false;

  @query('#block-type-dropdown')
  blockTypeDropdown!: SlDropdown;

  private _styleMenu!: Pane;
  private _showStyleDebugMenu = false;

  get mode() {
    return this.editor.mode;
  }

  set mode(value: 'page' | 'edgeless') {
    this.editor.mode = value;
  }

  @state()
  private _dark = getDarkModeConfig();

  get host() {
    return this.editor.host;
  }

  get doc() {
    return this.editor.doc;
  }

  get rootService() {
    return this.host.spec.getService('affine:page');
  }

  get command() {
    return this.host.command;
  }

  override createRenderRoot() {
    this._setThemeMode(this._dark);

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    matchMedia.addEventListener('change', this._darkModeChange);

    return this;
  }

  override connectedCallback() {
    super.connectedCallback();

    const readSelectionFromURL = async () => {
      const editorHost = this.editor.host;
      if (!editorHost) {
        await new Promise(resolve => {
          setTimeout(resolve, 500);
        });
        readSelectionFromURL().catch(console.error);
        return;
      }
      const url = new URL(window.location.toString());
      const sel = url.searchParams.get('sel');
      if (!sel) return;
      try {
        const json = JSON.parse(lz.decompressFromEncodedURIComponent(sel));
        editorHost.std.selection.fromJSON(json);
      } catch {
        return;
      }
    };
    readSelectionFromURL().catch(console.error);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    matchMedia.removeEventListener('change', this._darkModeChange);
  }

  private _switchEditorMode() {
    this.mode = this.mode === 'page' ? 'edgeless' : 'page';
  }

  private _toggleOutlinePanel() {
    this.outlinePanel.toggleDisplay();
  }

  private _toggleFramePanel() {
    this.framePanel.toggleDisplay();
  }

  private _toggleChatPanel() {
    this.chatPanel.toggleDisplay();
  }

  private _toggleCopilotPanel() {
    this.sidePanel.toggle(this.copilotPanel);
  }

  private _toggleDocsPanel() {
    this.leftSidePanel.toggle(this.docsPanel);
  }

  private _toggleCommentPanel() {
    document.body.append(this.commentPanel);
  }

  private _createMindMap() {
    const [_, ctx] = this.command
      .chain()
      .getSelectedBlocks({
        types: ['block'],
      })
      .run();
    const blocks = ctx.selectedBlocks;
    if (!blocks) return;

    const toTreeNode = (block: BlockModel): TreeNode => {
      return {
        text: block.text?.toString() ?? '',
        children: block.children.map(toTreeNode),
      };
    };
    const texts: BlockModel[] = [];
    const others: BlockModel[] = [];
    blocks.forEach(v => {
      if (v.model.flavour === 'affine:paragraph') {
        texts.push(v.model);
      } else {
        others.push(v.model);
      }
    });
    let node: TreeNode;
    if (texts.length === 1) {
      node = {
        text: texts[0].text?.toString() ?? '',
        children: others.map(v => toTreeNode(v)),
      };
    } else if (blocks.length === 1) {
      node = toTreeNode(blocks[0].model);
    } else {
      node = {
        text: 'Root',
        children: blocks.map(v => toTreeNode(v.model)),
      };
    }
    BlocksUtils.mindMap.drawInEdgeless(
      getEdgelessService(this.editor.host),
      node
    );
  }

  private _switchOffsetMode() {
    this._hasOffset = !this._hasOffset;
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

  private _exportPdf() {
    this.rootService.exportManager.exportPdf().catch(console.error);
  }

  private _exportHtml() {
    HtmlTransformer.exportDoc(this.doc).catch(console.error);
  }

  private _exportMarkDown() {
    MarkdownTransformer.exportDoc(this.doc).catch(console.error);
  }

  private _exportPng() {
    this.rootService.exportManager.exportPng().catch(console.error);
  }

  private async _exportSnapshot() {
    const file = await ZipTransformer.exportDocs(
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
      if (!file) {
        return;
      }
      try {
        const docs = await ZipTransformer.importDocs(this.collection, file);
        for (const doc of docs) {
          const noteBlock = window.doc.getBlockByFlavour('affine:note');
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
    const base64 = Utils.encodeCollectionAsYjsUpdateV2(this.collection);
    const url = new URL(window.location.toString());
    url.searchParams.set('init', base64);
    window.history.pushState({}, '', url);
  }

  private async _toggleStyleDebugMenu() {
    if (!styleDebugMenuLoaded) {
      styleDebugMenuLoaded = true;
      const { Pane } = await import('tweakpane');
      this._styleMenu = new Pane({ title: 'Waiting' });
      this._styleMenu.hidden = true;
      this._styleMenu.element.style.width = '650';
      initStyleDebugMenu(this._styleMenu, document.documentElement.style);
    }

    this._showStyleDebugMenu = !this._showStyleDebugMenu;
    this._showStyleDebugMenu
      ? (this._styleMenu.hidden = false)
      : (this._styleMenu.hidden = true);
  }

  private _toggleReadonly() {
    const doc = this.doc;
    doc.awarenessStore.setReadonly(doc.blockCollection, !doc.readonly);
  }

  private _shareSelection() {
    const selection = this.editor.host?.selection.value;
    if (!selection || selection.length === 0) {
      return;
    }
    const json = selection.map(sel => sel.toJSON());
    const hash = lz.compressToEncodedURIComponent(JSON.stringify(json));
    const url = new URL(window.location.toString());
    url.searchParams.set('sel', hash);
    window.history.pushState({}, '', url);
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

  private _toggleDarkMode() {
    this._setThemeMode(!this._dark);
  }

  private _darkModeChange = (e: MediaQueryListEvent) => {
    this._setThemeMode(!!e.matches);
  };

  override firstUpdated() {
    this.doc.slots.historyUpdated.on(() => {
      this._canUndo = this.doc.canUndo;
      this._canRedo = this.doc.canRedo;
    });

    this.editor.slots.editorModeSwitched.on(() => {
      this.requestUpdate();
    });
  }

  override update(changedProperties: Map<string, unknown>) {
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

        @media print {
          .debug-menu {
            display: none;
          }
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
      <div class="debug-menu default blocksuite-overlay">
        <div class="default-toolbar">
          <!-- undo/redo group -->
          <sl-button-group label="History">
            <!-- undo -->
            <sl-tooltip content="Undo" placement="bottom" hoist>
              <sl-button
                size="small"
                .disabled="${!this._canUndo}"
                @click="${() => this.doc.undo()}"
              >
                <sl-icon name="arrow-counterclockwise" label="Undo"></sl-icon>
              </sl-button>
            </sl-tooltip>
            <!-- redo -->
            <sl-tooltip content="Redo" placement="bottom" hoist>
              <sl-button
                size="small"
                .disabled="${!this._canRedo}"
                @click="${() => this.doc.redo()}"
              >
                <sl-icon name="arrow-clockwise" label="Redo"></sl-icon>
              </sl-button>
            </sl-tooltip>
          </sl-button-group>

          <!-- test operations -->
          <sl-dropdown id="test-operations-dropdown" placement="bottom" hoist>
            <sl-button size="small" slot="trigger" caret>
              Test Operations
            </sl-button>
            <sl-menu>
              <sl-menu-item @click="${this._exportMarkDown}">
                Export Markdown
              </sl-menu-item>
              <sl-menu-item @click="${this._exportHtml}">
                Export HTML
              </sl-menu-item>
              <sl-menu-item @click="${this._exportPdf}">
                Export PDF
              </sl-menu-item>
              <sl-menu-item @click="${this._exportPng}">
                Export PNG
              </sl-menu-item>
              <sl-menu-item @click="${this._exportSnapshot}">
                Export Snapshot
              </sl-menu-item>
              <sl-menu-item @click="${this._importSnapshot}">
                Import Snapshot
              </sl-menu-item>
              <sl-menu-item @click="${this._shareUrl}">
                Share URL
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleStyleDebugMenu}">
                Toggle CSS Debug Menu
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleReadonly}">
                Toggle Readonly
              </sl-menu-item>
              <sl-menu-item @click="${this._shareSelection}">
                Share Selection
              </sl-menu-item>
              <sl-menu-item @click="${this._switchOffsetMode}">
                Switch Offset Mode
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleOutlinePanel}">
                Toggle Outline Panel
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleFramePanel}">
                Toggle Frame Panel
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleChatPanel}">
                Toggle Chat Panel
              </sl-menu-item>
              <sl-menu-item @click="${this._createMindMap}">
                Create Mind Map
              </sl-menu-item>
              <sl-menu-item @click="${this._toggleCommentPanel}">
                Toggle Comment Panel
              </sl-menu-item>
              <sl-menu-item @click="${this._addNote}"> Add Note </sl-menu-item>
            </sl-menu>
          </sl-dropdown>

          <sl-tooltip content="Switch Editor" placement="bottom" hoist>
            <sl-button size="small" @click="${this._switchEditorMode}">
              <sl-icon name="repeat"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-tooltip
            content="🚧 Toggle Copilot Panel"
            placement="bottom"
            hoist
          >
            <sl-button size="small" @click="${this._toggleCopilotPanel}">
              <sl-icon name="stars"></sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-tooltip
            content="Toggle ${this._dark ? ' Light' : 'Dark'} Mode"
            placement="bottom"
            hoist
          >
            <sl-button size="small" @click="${this._toggleDarkMode}">
              <sl-icon
                name="${this._dark ? 'moon' : 'brightness-high'}"
              ></sl-icon>
            </sl-button>
          </sl-tooltip>

          <sl-button
            data-testid="docs-button"
            size="small"
            @click="${this._toggleDocsPanel}"
          >
            Docs
          </sl-button>
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
