import '@blocksuite/affine-shared/commands';
import '@blocksuite/blocks/effects';

import { AIChatMessage } from './blocks/ai-chat-block/components/ai-chat-messages.js';
import {
  ChatImage,
  ChatImages,
} from './blocks/ai-chat-block/components/chat-images.js';
import { ImagePlaceholder } from './blocks/ai-chat-block/components/image-placeholder.js';
import { TextRenderer } from './blocks/ai-chat-block/components/text-renderer.js';
import { UserInfo } from './blocks/ai-chat-block/components/user-info.js';
import {
  AIChatBlockComponent,
  AIChatMessages,
  EdgelessAIChatBlockComponent,
} from './blocks/index.js';
import {
  AffineEditorContainer,
  EdgelessEditor,
  PageEditor,
} from './editors/index.js';
import { CommentInput } from './fragments/comment/comment-input.js';
import { BacklinkButton } from './fragments/doc-meta-tags/backlink-popover.js';
import {
  AFFINE_FRAME_PANEL_BODY,
  FramePanelBody,
} from './fragments/frame-panel/body/frame-panel-body.js';
import {
  AFFINE_FRAME_CARD,
  FrameCard,
} from './fragments/frame-panel/card/frame-card.js';
import {
  AFFINE_FRAME_CARD_TITLE,
  FrameCardTitle,
} from './fragments/frame-panel/card/frame-card-title.js';
import {
  AFFINE_FRAME_TITLE_EDITOR,
  FrameCardTitleEditor,
} from './fragments/frame-panel/card/frame-card-title-editor.js';
import {
  AFFINE_FRAME_PANEL_HEADER,
  FramePanelHeader,
} from './fragments/frame-panel/header/frame-panel-header.js';
import {
  AFFINE_FRAMES_SETTING_MENU,
  FramesSettingMenu,
} from './fragments/frame-panel/header/frames-setting-menu.js';
import {
  AFFINE_FRAME_PANEL,
  AFFINE_OUTLINE_PANEL,
  AFFINE_OUTLINE_VIEWER,
  CommentPanel,
  DocTitle,
  FramePanel,
  OutlinePanel,
  OutlineViewer,
} from './fragments/index.js';
import {
  AFFINE_OUTLINE_NOTICE,
  OutlineNotice,
} from './fragments/outline/body/outline-notice.js';
import {
  AFFINE_OUTLINE_PANEL_BODY,
  OutlinePanelBody,
} from './fragments/outline/body/outline-panel-body.js';
import {
  AFFINE_OUTLINE_NOTE_CARD,
  OutlineNoteCard,
} from './fragments/outline/card/outline-card.js';
import {
  AFFINE_OUTLINE_BLOCK_PREVIEW,
  OutlineBlockPreview,
} from './fragments/outline/card/outline-preview.js';
import {
  AFFINE_OUTLINE_PANEL_HEADER,
  OutlinePanelHeader,
} from './fragments/outline/header/outline-panel-header.js';
import {
  AFFINE_OUTLINE_NOTE_PREVIEW_SETTING_MENU,
  OutlineNotePreviewSettingMenu,
} from './fragments/outline/header/outline-setting-menu.js';

export function effects() {
  customElements.define('page-editor', PageEditor);
  customElements.define('comment-input', CommentInput);
  customElements.define('doc-title', DocTitle);
  customElements.define(
    AFFINE_OUTLINE_NOTE_PREVIEW_SETTING_MENU,
    OutlineNotePreviewSettingMenu
  );
  customElements.define(
    'affine-edgeless-ai-chat',
    EdgelessAIChatBlockComponent
  );
  customElements.define(AFFINE_FRAME_PANEL, FramePanel);
  customElements.define(AFFINE_OUTLINE_NOTICE, OutlineNotice);
  customElements.define('comment-panel', CommentPanel);
  customElements.define('affine-ai-chat', AIChatBlockComponent);
  customElements.define(AFFINE_OUTLINE_PANEL, OutlinePanel);
  customElements.define('backlink-button', BacklinkButton);
  customElements.define(AFFINE_OUTLINE_PANEL_HEADER, OutlinePanelHeader);
  customElements.define('affine-editor-container', AffineEditorContainer);
  customElements.define(AFFINE_OUTLINE_NOTE_CARD, OutlineNoteCard);
  customElements.define(AFFINE_FRAME_TITLE_EDITOR, FrameCardTitleEditor);
  customElements.define('edgeless-editor', EdgelessEditor);
  customElements.define('ai-chat-message', AIChatMessage);
  customElements.define('ai-chat-messages', AIChatMessages);
  customElements.define('image-placeholder', ImagePlaceholder);
  customElements.define('chat-image', ChatImage);
  customElements.define('chat-images', ChatImages);
  customElements.define(AFFINE_FRAME_CARD, FrameCard);
  customElements.define('user-info', UserInfo);
  customElements.define(AFFINE_OUTLINE_VIEWER, OutlineViewer);
  customElements.define(AFFINE_FRAME_CARD_TITLE, FrameCardTitle);
  customElements.define('text-renderer', TextRenderer);
  customElements.define(AFFINE_OUTLINE_BLOCK_PREVIEW, OutlineBlockPreview);
  customElements.define(AFFINE_FRAME_PANEL_BODY, FramePanelBody);
  customElements.define(AFFINE_FRAME_PANEL_HEADER, FramePanelHeader);
  customElements.define(AFFINE_OUTLINE_PANEL_BODY, OutlinePanelBody);
  customElements.define(AFFINE_FRAMES_SETTING_MENU, FramesSettingMenu);
}
