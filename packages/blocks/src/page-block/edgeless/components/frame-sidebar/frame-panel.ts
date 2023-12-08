import './header/frame-sidebar-header.js';
import './body/frame-sidebar-body.js';

import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { FrameSidebarBody } from './body/frame-sidebar-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramePreview } from './card/frame-preview.js';
import { FrameSidebarHeader } from './header/frame-sidebar-header.js';
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

  .frame-sidebar-body {
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
      <frame-sidebar-header .edgeless=${this.edgeless}></frame-sidebar-header>
      <frame-sidebar-body
        class="frame-sidebar-body"
        .edgeless=${this.edgeless}
        .fitPadding=${[50, 380, 50, 50]}
      ></frame-sidebar-body>
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
  'frame-sidebar-header': FrameSidebarHeader,
  'frame-sidebar-body': FrameSidebarBody,
  'frames-setting-menu': FramesSettingMenu,
  'frame-card': FrameCard,
  'frame-card-title-editor': FrameCardTitleEditor,
  'frame-preview': FramePreview,
};

export function registerFrameSidebarComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
