import { DisposableGroup } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../editors/editor-container.js';
import { OutlineNoteCard } from './outline-card.js';
import { OutlinePanelBody } from './outline-panel-body.js';
import { OutlinePanelHeader } from './outline-panel-header.js';
import { OutlineBlockPreview } from './outline-preview.js';
import { OutlineNotePreviewSettingMenu } from './outline-setting-menu.js';

export class OutlinePanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .outline-panel-container {
      background-color: var(--affine-background-primary-color);
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: stretch;

      height: 100%;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      padding-top: 8px;
    }

    .outline-panel-body {
      flex-grow: 1;
      width: 100%;

      overflow-y: scroll;
    }
  `;
  @property({ attribute: false })
  editor!: AffineEditorContainer;

  @property({ attribute: false })
  showPreviewIcon = false;

  @property({ attribute: false })
  enableNotesSorting = false;

  @property({ attribute: false })
  fitPadding!: number[];

  get page() {
    return this.editor.page;
  }

  get host() {
    return this.editor.host;
  }

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-page');
  }

  get mode() {
    return this.editor.mode;
  }

  private _toggleShowPreviewIcon = (on: boolean) => {
    this.showPreviewIcon = on;
  };

  private _toggleNotesSorting = () => {
    this.enableNotesSorting = !this.enableNotesSorting;
  };

  private _editorDisposables: DisposableGroup | null = null;

  private _clearEditorDisposables() {
    this._editorDisposables?.dispose();
    this._editorDisposables = null;
  }

  private _setEditorDisposables() {
    this._clearEditorDisposables();
    this._editorDisposables = new DisposableGroup();
    this._editorDisposables.add(
      this.editor.slots.pageModeSwitched.on(() => {
        this.editor.updateComplete
          .then(() => {
            this.requestUpdate();
          })
          .catch(console.error);
      })
    );
    this._editorDisposables.add(
      this.editor.slots.pageUpdated.on(() => {
        this.editor.updateComplete
          .then(() => {
            this.requestUpdate();
          })
          .catch(console.error);
      })
    );
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('editor')) {
      this._setEditorDisposables();
    }
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearEditorDisposables();
  }

  override render() {
    return html`
      <div class="outline-panel-container">
        <outline-panel-header
          .showPreviewIcon=${this.showPreviewIcon}
          .enableNotesSorting=${this.enableNotesSorting}
          .toggleShowPreviewIcon=${this._toggleShowPreviewIcon}
          .toggleNotesSorting=${this._toggleNotesSorting}
        ></outline-panel-header>
        <outline-panel-body
          class="outline-panel-body"
          .page=${this.page}
          .fitPadding=${this.fitPadding}
          .edgeless=${this.edgeless}
          .editorHost=${this.host}
          .mode=${this.mode}
          .showPreviewIcon=${this.showPreviewIcon}
          .enableNotesSorting=${this.enableNotesSorting}
          .toggleNotesSorting=${this._toggleNotesSorting}
        >
        </outline-panel-body>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'outline-panel': OutlinePanel;
  }
}

const componentsMap = {
  'outline-note-card': OutlineNoteCard,
  'outline-block-preview': OutlineBlockPreview,
  'outline-panel': OutlinePanel,
  'outline-note-preview-setting-menu': OutlineNotePreviewSettingMenu,
  'outline-panel-body': OutlinePanelBody,
  'outline-panel-header': OutlinePanelHeader,
};

export function registerOutlinePanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
