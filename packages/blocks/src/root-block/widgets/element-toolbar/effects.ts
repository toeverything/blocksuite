import { EdgelessAddFrameButton } from './add-frame-button.js';
import { EdgelessAddGroupButton } from './add-group-button.js';
import { EdgelessAlignButton } from './align-button.js';
import { EdgelessChangeAttachmentButton } from './change-attachment-button.js';
import { EdgelessChangeBrushButton } from './change-brush-button.js';
import { EdgelessChangeConnectorButton } from './change-connector-button.js';
import { EdgelessChangeEmbedCardButton } from './change-embed-card-button.js';
import { EdgelessChangeFrameButton } from './change-frame-button.js';
import { EdgelessChangeGroupButton } from './change-group-button.js';
import { EdgelessChangeImageButton } from './change-image-button.js';
import {
  EdgelessChangeMindmapButton,
  EdgelessChangeMindmapLayoutPanel,
  EdgelessChangeMindmapStylePanel,
} from './change-mindmap-button.js';
import { EdgelessChangeNoteButton } from './change-note-button.js';
import { EdgelessChangeShapeButton } from './change-shape-button.js';
import { EdgelessChangeTextMenu } from './change-text-menu.js';
import {
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  EdgelessElementToolbarWidget,
} from './index.js';
import { EdgelessLockButton } from './lock-button.js';
import { EdgelessMoreButton } from './more-menu/button.js';
import { EdgelessReleaseFromGroupButton } from './release-from-group-button.js';

export function effects() {
  customElements.define(
    EDGELESS_ELEMENT_TOOLBAR_WIDGET,
    EdgelessElementToolbarWidget
  );
  customElements.define('edgeless-add-frame-button', EdgelessAddFrameButton);
  customElements.define('edgeless-add-group-button', EdgelessAddGroupButton);
  customElements.define('edgeless-align-button', EdgelessAlignButton);
  customElements.define(
    'edgeless-change-attachment-button',
    EdgelessChangeAttachmentButton
  );
  customElements.define(
    'edgeless-change-brush-button',
    EdgelessChangeBrushButton
  );
  customElements.define(
    'edgeless-change-connector-button',
    EdgelessChangeConnectorButton
  );
  customElements.define(
    'edgeless-change-embed-card-button',
    EdgelessChangeEmbedCardButton
  );
  customElements.define(
    'edgeless-change-frame-button',
    EdgelessChangeFrameButton
  );
  customElements.define(
    'edgeless-change-group-button',
    EdgelessChangeGroupButton
  );
  customElements.define(
    'edgeless-change-image-button',
    EdgelessChangeImageButton
  );
  customElements.define(
    'edgeless-change-mindmap-style-panel',
    EdgelessChangeMindmapStylePanel
  );
  customElements.define(
    'edgeless-change-mindmap-layout-panel',
    EdgelessChangeMindmapLayoutPanel
  );
  customElements.define(
    'edgeless-change-mindmap-button',
    EdgelessChangeMindmapButton
  );
  customElements.define(
    'edgeless-change-note-button',
    EdgelessChangeNoteButton
  );
  customElements.define(
    'edgeless-change-shape-button',
    EdgelessChangeShapeButton
  );
  customElements.define('edgeless-change-text-menu', EdgelessChangeTextMenu);
  customElements.define(
    'edgeless-release-from-group-button',
    EdgelessReleaseFromGroupButton
  );
  customElements.define('edgeless-more-button', EdgelessMoreButton);
  customElements.define('edgeless-lock-button', EdgelessLockButton);
}

declare global {
  interface HTMLElementTagNameMap {
    [EDGELESS_ELEMENT_TOOLBAR_WIDGET]: EdgelessElementToolbarWidget;
    'edgeless-add-frame-button': EdgelessAddFrameButton;
    'edgeless-add-group-button': EdgelessAddGroupButton;
    'edgeless-align-button': EdgelessAlignButton;
    'edgeless-change-attachment-button': EdgelessChangeAttachmentButton;
    'edgeless-change-brush-button': EdgelessChangeBrushButton;
    'edgeless-change-connector-button': EdgelessChangeConnectorButton;
    'edgeless-change-embed-card-button': EdgelessChangeEmbedCardButton;
    'edgeless-change-frame-button': EdgelessChangeFrameButton;
    'edgeless-change-group-button': EdgelessChangeGroupButton;
    'edgeless-change-mindmap-style-panel': EdgelessChangeMindmapStylePanel;
    'edgeless-change-mindmap-layout-panel': EdgelessChangeMindmapLayoutPanel;
    'edgeless-change-mindmap-button': EdgelessChangeMindmapButton;
    'edgeless-change-note-button': EdgelessChangeNoteButton;
    'edgeless-change-shape-button': EdgelessChangeShapeButton;
    'edgeless-change-text-menu': EdgelessChangeTextMenu;
    'edgeless-release-from-group-button': EdgelessReleaseFromGroupButton;
    'edgeless-more-button': EdgelessMoreButton;
    'edgeless-lock-button': EdgelessLockButton;
  }
}
