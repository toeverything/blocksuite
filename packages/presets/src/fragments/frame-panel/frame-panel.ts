import './header/frame-panel-header.js';
import './body/frame-panel-body.js';

import { type BlockSuiteRoot, WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { EditorContainer } from '../../index.js';
import { FramePanelBody } from './body/frame-panel-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitle } from './card/frame-card-title.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramePanelHeader } from './header/frame-panel-header.js';
import { FramesSettingMenu } from './header/frames-setting-menu.js';

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .frame-panel-container {
    background-color: var(--affine-background-primary-color);
    /* padding: 0 16px; */
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    height: 100%;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    padding: 0 16px;
  }

  .frame-panel-body {
    padding-top: 16px;
    flex-grow: 1;
    width: 100%;

    overflow-y: scroll;
  }
`;

export class FramePanel extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  editor!: EditorContainer;

  @property({ attribute: false })
  fitPadding: number[] = [50, 380, 50, 50];

  get page() {
    return this.editor.page;
  }

  get root() {
    return this.editor.root as BlockSuiteRoot;
  }

  get edgeless() {
    return this.editor.querySelector('affine-edgeless-page');
  }

  private _changeEditorMode = (mode: 'page' | 'edgeless') => {
    this.editor.mode = mode;
  };

  override connectedCallback() {
    super.connectedCallback();
  }

  override firstUpdated() {
    const { disposables } = this;
    disposables.add(
      this.editor.slots.pageModeSwitched.on(() => {
        this.editor.updateComplete.then(() => {
          this.requestUpdate();
        });
      })
    );
    disposables.add(
      this.editor.slots.pageUpdated.on(() => {
        this.editor.updateComplete.then(() => {
          this.requestUpdate();
        });
      })
    );
  }

  override render() {
    return html`<div class="frame-panel-container">
      <frame-panel-header
        .edgeless=${this.edgeless}
        .changeEditorMode=${this._changeEditorMode}
      ></frame-panel-header>
      <frame-panel-body
        class="frame-panel-body"
        .edgeless=${this.edgeless}
        .page=${this.page}
        .root=${this.root}
        .changeEditorMode=${this._changeEditorMode}
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
