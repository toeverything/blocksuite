import './header/frames-sidebar-header.js';
import './body/frames-sidebar-body.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { ToggleSwitch } from '../../../../_common/components/toggle-switch.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { FramesSidebarBody } from './body/frames-sidebar-body.js';
import { FrameCard } from './card/frame-card.js';
import { FrameCardTitleEditor } from './card/frame-card-title-editor.js';
import { FramesSettingMenu } from './header/frames-setting-menu.js';
import { FramesSidebarHeader } from './header/frames-sidebar-header.js';

const styles = css`
  .frames-panel-container {
    display: flex;
    flex-direction: column;
    width: 284px;
    height: 100%;
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
        .edgeless=${this.edgeless}
        .fitPadding=${[50, 300, 50, 50]}
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
};

export function registerFramesSidebarComponents(
  callback: (components: typeof componentsMap) => void
) {
  callback(componentsMap);
}
