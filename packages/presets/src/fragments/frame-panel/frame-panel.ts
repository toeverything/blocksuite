import './header/frame-panel-header.js';
import './body/frame-panel-body.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { FramePreview } from '@blocksuite/blocks';
import { DisposableGroup } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, type PropertyValues, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { AffineEditorContainer } from '../../index.js';
import { FramePanelBody } from './body/frame-panel-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitle } from './card/frame-card-title.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramePanelHeader } from './header/frame-panel-header.js';
import { FramesSettingMenu } from './header/frames-setting-menu.js';

const styles = css`
  frame-panel {
    display: block;
    width: 100%;
    height: 100%;
  }

  .frame-panel-container {
    background-color: var(--affine-background-primary-color);
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    height: 100%;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    padding: 8px;
  }

  .frame-panel-body {
    padding-top: 12px;
    flex-grow: 1;
    width: 100%;

    overflow: auto;
    overflow-x: hidden;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: transparent transparent; /* For Firefox */
  }

  .frame-panel-body::-webkit-scrollbar {
    width: 4px;
  }

  .frame-panel-body::-webkit-scrollbar-thumb {
    border-radius: 2px;
  }

  .frame-panel-body:hover::-webkit-scrollbar-thumb {
    background-color: var(--affine-black-30);
  }

  .frame-panel-body::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .frame-panel-body::-webkit-scrollbar-corner {
    display: none;
  }
`;

export class FramePanel extends WithDisposable(ShadowlessElement) {
  get doc() {
    return this.editor.doc;
  }

  get host() {
    return this.editor.host;
  }

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-root');
  }

  static override styles = styles;

  private _editorDisposables: DisposableGroup | null = null;

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;

  @property({ attribute: false })
  accessor fitPadding: number[] = [50, 380, 50, 50];

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
          .then(() => this.requestUpdate())
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
    if (!customElements.get('frame-preview')) {
      customElements.define('frame-preview', FramePreview);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearEditorDisposables();
  }

  override render() {
    return html`<div class="frame-panel-container">
      <frame-panel-header
        .edgeless=${this.edgeless}
        .editorHost=${this.host}
      ></frame-panel-header>
      <frame-panel-body
        class="frame-panel-body"
        .edgeless=${this.edgeless}
        .doc=${this.doc}
        .editorHost=${this.host}
        .fitPadding=${this.fitPadding}
      ></frame-panel-body>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-panel': FramePanel;
  }
}

const componentsMap = {
  'frame-panel': FramePanel,
  'frame-panel-header': FramePanelHeader,
  'frame-panel-body': FramePanelBody,
  'frames-setting-menu': FramesSettingMenu,
  'frame-card': FrameCard,
  'frame-card-title': FrameCardTitle,
  'frame-card-title-editor': FrameCardTitleEditor,
};

export function registerFramePanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
