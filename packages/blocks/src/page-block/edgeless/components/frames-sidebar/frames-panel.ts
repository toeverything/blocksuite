import './header/frames-sidebar-header.js';
import './body/frames-sidebar-body.js';

import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { FramesSidebarBody } from './body/frames-sidebar-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramePreview } from './card/frame-preview.js';
import { FramesSettingMenu } from './header/frames-setting-menu.js';
import { FramesSidebarHeader } from './header/frames-sidebar-header.js';

const styles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .frames-panel-container {
    background-color: var(--affine-background-primary-color);
    /* padding: 0 16px; */
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: stretch;

    height: 100%;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
  }

  .frames-sidebar-body {
    padding-top: 12px;
    flex-grow: 1;
    width: 100%;

    overflow-y: scroll;
  }
`;

export class FramesPanel extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  override render() {
    if (!this.edgeless) return nothing;

    return html`<div class="frames-panel-container">
      <frames-sidebar-header .edgeless=${this.edgeless}></frames-sidebar-header>
      <frames-sidebar-body
        class="frames-sidebar-body"
        .edgeless=${this.edgeless}
        .fitPadding=${[50, 380, 50, 50]}
      ></frames-sidebar-body>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frames-panel': FramesPanel;
  }
}

const componentsMap = {
  'frames-panel': FramesPanel,
  'frames-sidebar-header': FramesSidebarHeader,
  'frames-sidebar-body': FramesSidebarBody,
  'frames-setting-menu': FramesSettingMenu,
  'frame-card': FrameCard,
  'frame-card-title-editor': FrameCardTitleEditor,
  'frame-preview': FramePreview,
};

export function registerFramesSidebarComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
