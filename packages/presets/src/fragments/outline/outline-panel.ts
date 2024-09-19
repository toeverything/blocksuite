import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../editors/editor-container.js';

import { type OutlineSettingsDataType, outlineSettingsKey } from './config.js';

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

export const AFFINE_OUTLINE_PANEL = 'affine-outline-panel';

export class OutlinePanel extends SignalWatcher(WithDisposable(LitElement)) {
  static override styles = styles;

  private _setNoticeVisibility = (visibility: boolean) => {
    this._noticeVisible = visibility;
  };

  private _settings: OutlineSettingsDataType = {
    showIcons: false,
    enableSorting: false,
  };

  private _toggleNotesSorting = () => {
    this._enableNotesSorting = !this._enableNotesSorting;
    this._updateAndSaveSettings({ enableSorting: this._enableNotesSorting });
  };

  private _toggleShowPreviewIcon = (on: boolean) => {
    this._showPreviewIcon = on;
    this._updateAndSaveSettings({ showIcons: on });
  };

  get doc() {
    return this.editor.doc;
  }

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-root');
  }

  get host() {
    return this.editor.host;
  }

  get mode() {
    return this.editor.mode;
  }

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

  override connectedCallback() {
    super.connectedCallback();
    this._loadSettingsFromLocalStorage();
  }

  override render() {
    if (!this.host) return;

    return html`
      <div class="outline-panel-container">
        <affine-outline-panel-header
          .showPreviewIcon=${this._showPreviewIcon}
          .enableNotesSorting=${this._enableNotesSorting}
          .toggleShowPreviewIcon=${this._toggleShowPreviewIcon}
          .toggleNotesSorting=${this._toggleNotesSorting}
        ></affine-outline-panel-header>
        <affine-outline-panel-body
          class="outline-panel-body"
          .doc=${this.doc}
          .fitPadding=${this.fitPadding}
          .edgeless=${this.edgeless}
          .editor=${this.editor}
          .mode=${this.mode}
          .showPreviewIcon=${this._showPreviewIcon}
          .enableNotesSorting=${this._enableNotesSorting}
          .toggleNotesSorting=${this._toggleNotesSorting}
          .noticeVisible=${this._noticeVisible}
          .setNoticeVisibility=${this._setNoticeVisibility}
        >
        </affine-outline-panel-body>
        <affine-outline-notice
          .noticeVisible=${this._noticeVisible}
          .toggleNotesSorting=${this._toggleNotesSorting}
          .setNoticeVisibility=${this._setNoticeVisibility}
        ></affine-outline-notice>
      </div>
    `;
  }

  @state()
  private accessor _enableNotesSorting = false;

  @state()
  private accessor _noticeVisible = false;

  @state()
  private accessor _showPreviewIcon = false;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor fitPadding!: number[];
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_OUTLINE_PANEL]: OutlinePanel;
  }
}
