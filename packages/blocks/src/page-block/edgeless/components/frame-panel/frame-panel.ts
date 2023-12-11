import './header/frame-panel-header.js';
import './body/frame-panel-body.js';

import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { FramePanelBody } from './body/frame-panel-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramePreview } from './card/frame-preview.js';
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
  }

  .frame-panel-body {
    padding-top: 12px;
    flex-grow: 1;
    width: 100%;

    overflow-y: scroll;
  }
`;

export class FramePanel extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  override render() {
    if (!this.edgeless) return nothing;

    return html`<div class="frame-panel-container">
      <frame-panel-header .edgeless=${this.edgeless}></frame-panel-header>
      <frame-panel-body
        class="frame-panel-body"
        .edgeless=${this.edgeless}
        .fitPadding=${[50, 380, 50, 50]}
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
  'frame-card-title-editor': FrameCardTitleEditor,
  'frame-preview': FramePreview,
};

export function registerFramePanelComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
