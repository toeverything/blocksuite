import { WithDisposable } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../editors/editor-container.js';
import { OutlineNotice } from './body/outline-notice.js';
import { OutlinePanelBody } from './body/outline-panel-body.js';
import { OutlineNoteCard } from './card/outline-card.js';
import { OutlineBlockPreview } from './card/outline-preview.js';
import { type OutlineSettingsDataType, outlineSettingsKey } from './config.js';
import { OutlinePanelHeader } from './header/outline-panel-header.js';
import { OutlineNotePreviewSettingMenu } from './header/outline-setting-menu.js';

const styles = css`
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
    position: relative;
  }

  .outline-panel-body {
    flex-grow: 1;
    width: 100%;

    overflow-y: scroll;
  }
  .outline-panel-body::-webkit-scrollbar {
    width: 4px;
  }
  .outline-panel-body::-webkit-scrollbar-thumb {
    border-radius: 2px;
  }
  .outline-panel-body:hover::-webkit-scrollbar-thumb {
    background-color: var(--affine-black-30);
  }
  .outline-panel-body::-webkit-scrollbar-track {
    background-color: transparent;
  }
  .outline-panel-body::-webkit-scrollbar-corner {
    display: none;
  }
`;
export class OutlinePanel extends WithDisposable(LitElement) {
  get doc() {
    return this.editor.doc;
  }

  get host() {
    return this.editor.host;
  }

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-root');
  }

  get mode() {
    return this.editor.mode;
  }

  static override styles = styles;

  @state()
  private accessor _showPreviewIcon = false;

  @state()
  private accessor _enableNotesSorting = false;

  @state()
  private accessor _noticeVisible = false;

  private _settings: OutlineSettingsDataType = {
    showIcons: false,
    enableSorting: false,
  };

  private _editorDisposables: DisposableGroup | null = null;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor fitPadding!: number[];

  private _loadSettingsFromLocalStorage() {
    const settings = localStorage.getItem(outlineSettingsKey);
    if (settings) {
      this._settings = JSON.parse(settings);
      this._showPreviewIcon = this._settings.showIcons;
      this._enableNotesSorting = this._settings.enableSorting;
    }
  }

  private _saveSettingsToLocalStorage() {
    localStorage.setItem(outlineSettingsKey, JSON.stringify(this._settings));
  }

  private _updateAndSaveSettings(
    newSettings: Partial<OutlineSettingsDataType>
  ) {
    this._settings = { ...this._settings, ...newSettings };
    this._saveSettingsToLocalStorage();
  }

  private _toggleShowPreviewIcon = (on: boolean) => {
    this._showPreviewIcon = on;
    this._updateAndSaveSettings({ showIcons: on });
  };

  private _toggleNotesSorting = () => {
    this._enableNotesSorting = !this._enableNotesSorting;
    this._updateAndSaveSettings({ enableSorting: this._enableNotesSorting });
  };

  private _setNoticeVisibility = (visibility: boolean) => {
    this._noticeVisible = visibility;
  };

  private _clearEditorDisposables() {
    this._editorDisposables?.dispose();
    this._editorDisposables = null;
  }

  private _setEditorDisposables() {
    this._clearEditorDisposables();
    this._editorDisposables = new DisposableGroup();
    this._editorDisposables.add(
      this.editor.slots.editorModeSwitched.on(() => {
        this.editor.updateComplete
          .then(() => {
            this.requestUpdate();
          })
          .catch(console.error);
      })
    );
    this._editorDisposables.add(
      this.editor.slots.docUpdated.on(() => {
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
    this._loadSettingsFromLocalStorage();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearEditorDisposables();
  }

  override render() {
    return html`
      <div class="outline-panel-container">
        <outline-panel-header
          .showPreviewIcon=${this._showPreviewIcon}
          .enableNotesSorting=${this._enableNotesSorting}
          .toggleShowPreviewIcon=${this._toggleShowPreviewIcon}
          .toggleNotesSorting=${this._toggleNotesSorting}
        ></outline-panel-header>
        <outline-panel-body
          class="outline-panel-body"
          .doc=${this.doc}
          .fitPadding=${this.fitPadding}
          .edgeless=${this.edgeless}
          .editorHost=${this.host}
          .mode=${this.mode}
          .showPreviewIcon=${this._showPreviewIcon}
          .enableNotesSorting=${this._enableNotesSorting}
          .toggleNotesSorting=${this._toggleNotesSorting}
          .noticeVisible=${this._noticeVisible}
          .setNoticeVisibility=${this._setNoticeVisibility}
        >
        </outline-panel-body>
        <outline-notice
          .noticeVisible=${this._noticeVisible}
          .toggleNotesSorting=${this._toggleNotesSorting}
          .setNoticeVisibility=${this._setNoticeVisibility}
        ></outline-notice>
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
  'outline-notice': OutlineNotice,
};

export function registerOutlinePanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
