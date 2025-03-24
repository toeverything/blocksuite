import { effects as gfxConnectorEffects } from '@blocksuite/affine-gfx-connector/effects';
import { effects as gfxNoteEffects } from '@blocksuite/affine-gfx-note/effects';
import { effects as gfxShapeEffects } from '@blocksuite/affine-gfx-shape/effects';
import { effects as gfxCanvasTextEffects } from '@blocksuite/affine-gfx-text/effects';
import { effects as widgetEdgelessToolbarEffects } from '@blocksuite/affine-widget-edgeless-toolbar/effects';

import { EdgelessAutoCompletePanel } from './edgeless/components/auto-complete/auto-complete-panel.js';
import { EdgelessAutoComplete } from './edgeless/components/auto-complete/edgeless-auto-complete.js';
import {
  NOTE_SLICER_WIDGET,
  NoteSlicer,
} from './edgeless/components/note-slicer/index.js';
import { EdgelessFontFamilyPanel } from './edgeless/components/panel/font-family-panel.js';
import { EdgelessFontWeightAndStylePanel } from './edgeless/components/panel/font-weight-and-style-panel.js';
import { EdgelessScalePanel } from './edgeless/components/panel/scale-panel.js';
import { EdgelessSizePanel } from './edgeless/components/panel/size-panel.js';
import { StrokeStylePanel } from './edgeless/components/panel/stroke-style-panel.js';
import {
  EDGELESS_DRAGGING_AREA_WIDGET,
  EdgelessDraggingAreaRectWidget,
} from './edgeless/components/rects/edgeless-dragging-area-rect.js';
import {
  EDGELESS_SELECTED_RECT_WIDGET,
  EdgelessSelectedRectWidget,
} from './edgeless/components/rects/edgeless-selected-rect.js';
import { EdgelessGroupTitleEditor } from './edgeless/components/text/edgeless-group-title-editor.js';
import { EdgelessBrushMenu } from './edgeless/components/toolbar/brush/brush-menu.js';
import { EdgelessBrushToolButton } from './edgeless/components/toolbar/brush/brush-tool-button.js';
import { EdgelessSlideMenu } from './edgeless/components/toolbar/common/slide-menu.js';
import { ToolbarArrowUpIcon } from './edgeless/components/toolbar/common/toolbar-arrow-up-icon.js';
import { EdgelessDefaultToolButton } from './edgeless/components/toolbar/default/default-tool-button.js';
import { EdgelessEraserToolButton } from './edgeless/components/toolbar/eraser/eraser-tool-button.js';
import { EdgelessLassoToolButton } from './edgeless/components/toolbar/lasso/lasso-tool-button.js';
import { EdgelessLinkToolButton } from './edgeless/components/toolbar/link/link-tool-button.js';
import { MindMapPlaceholder } from './edgeless/components/toolbar/mindmap/mindmap-importing-placeholder.js';
import { EdgelessMindmapMenu } from './edgeless/components/toolbar/mindmap/mindmap-menu.js';
import { EdgelessMindmapToolButton } from './edgeless/components/toolbar/mindmap/mindmap-tool-button.js';
import { OverlayScrollbar } from './edgeless/components/toolbar/template/overlay-scrollbar.js';
import { AffineTemplateLoading } from './edgeless/components/toolbar/template/template-loading.js';
import { EdgelessTemplatePanel } from './edgeless/components/toolbar/template/template-panel.js';
import { EdgelessTemplateButton } from './edgeless/components/toolbar/template/template-tool-button.js';
import {
  AffineImageToolbarWidget,
  AffineModalWidget,
  EdgelessRootBlockComponent,
  EdgelessRootPreviewBlockComponent,
  PageRootBlockComponent,
  PreviewRootBlockComponent,
} from './index.js';
import {
  EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET,
  EdgelessNavigatorBlackBackgroundWidget,
} from './widgets/edgeless-navigator-bg/index.js';
import {
  AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET,
  AffineEdgelessZoomToolbarWidget,
} from './widgets/edgeless-zoom-toolbar/index.js';
import { ZoomBarToggleButton } from './widgets/edgeless-zoom-toolbar/zoom-bar-toggle-button.js';
import { EdgelessZoomToolbar } from './widgets/edgeless-zoom-toolbar/zoom-toolbar.js';
import { AffineImageToolbar } from './widgets/image-toolbar/components/image-toolbar.js';
import { AFFINE_IMAGE_TOOLBAR_WIDGET } from './widgets/image-toolbar/index.js';
import {
  AFFINE_INNER_MODAL_WIDGET,
  AffineInnerModalWidget,
} from './widgets/inner-modal/inner-modal.js';
import { effects as widgetMobileToolbarEffects } from './widgets/keyboard-toolbar/effects.js';
import { effects as widgetLinkedDocEffects } from './widgets/linked-doc/effects.js';
import { Loader } from './widgets/linked-doc/import-doc/loader.js';
import { AffineCustomModal } from './widgets/modal/custom-modal.js';
import { AFFINE_MODAL_WIDGET } from './widgets/modal/modal.js';
import {
  AFFINE_PAGE_DRAGGING_AREA_WIDGET,
  AffinePageDraggingAreaWidget,
} from './widgets/page-dragging-area/page-dragging-area.js';
import {
  AFFINE_VIEWPORT_OVERLAY_WIDGET,
  AffineViewportOverlayWidget,
} from './widgets/viewport-overlay/viewport-overlay.js';

export function effects() {
  // Run other effects
  widgetMobileToolbarEffects();
  widgetLinkedDocEffects();
  widgetEdgelessToolbarEffects();

  // Register components by category
  registerRootComponents();
  registerGfxEffects();
  registerWidgets();
  registerEdgelessToolbarComponents();
  registerEdgelessPanelComponents();
  registerEdgelessEditorComponents();
  registerMiscComponents();
}

function registerRootComponents() {
  customElements.define('affine-page-root', PageRootBlockComponent);
  customElements.define('affine-preview-root', PreviewRootBlockComponent);
  customElements.define('affine-edgeless-root', EdgelessRootBlockComponent);
  customElements.define(
    'affine-edgeless-root-preview',
    EdgelessRootPreviewBlockComponent
  );
}

function registerGfxEffects() {
  gfxCanvasTextEffects();
  gfxShapeEffects();
  gfxNoteEffects();
  gfxConnectorEffects();
}

function registerWidgets() {
  customElements.define(AFFINE_INNER_MODAL_WIDGET, AffineInnerModalWidget);
  customElements.define(AFFINE_MODAL_WIDGET, AffineModalWidget);
  customElements.define(
    AFFINE_PAGE_DRAGGING_AREA_WIDGET,
    AffinePageDraggingAreaWidget
  );
  customElements.define(AFFINE_IMAGE_TOOLBAR_WIDGET, AffineImageToolbarWidget);
  customElements.define(
    AFFINE_VIEWPORT_OVERLAY_WIDGET,
    AffineViewportOverlayWidget
  );
  customElements.define(
    AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET,
    AffineEdgelessZoomToolbarWidget
  );
}

function registerEdgelessToolbarComponents() {
  // Tool buttons
  customElements.define('edgeless-brush-tool-button', EdgelessBrushToolButton);
  customElements.define(
    'edgeless-default-tool-button',
    EdgelessDefaultToolButton
  );
  customElements.define(
    'edgeless-eraser-tool-button',
    EdgelessEraserToolButton
  );
  customElements.define('edgeless-link-tool-button', EdgelessLinkToolButton);
  customElements.define('edgeless-lasso-tool-button', EdgelessLassoToolButton);
  customElements.define(
    'edgeless-mindmap-tool-button',
    EdgelessMindmapToolButton
  );
  customElements.define('edgeless-template-button', EdgelessTemplateButton);

  // Menus
  customElements.define('edgeless-brush-menu', EdgelessBrushMenu);
  customElements.define('edgeless-mindmap-menu', EdgelessMindmapMenu);
  customElements.define('edgeless-slide-menu', EdgelessSlideMenu);

  // Toolbar components
  customElements.define('toolbar-arrow-up-icon', ToolbarArrowUpIcon);
}

function registerEdgelessPanelComponents() {
  customElements.define(
    'edgeless-font-weight-and-style-panel',
    EdgelessFontWeightAndStylePanel
  );
  customElements.define('edgeless-size-panel', EdgelessSizePanel);
  customElements.define('edgeless-scale-panel', EdgelessScalePanel);
  customElements.define('edgeless-font-family-panel', EdgelessFontFamilyPanel);
  customElements.define('stroke-style-panel', StrokeStylePanel);
}

function registerEdgelessEditorComponents() {
  customElements.define(
    'edgeless-group-title-editor',
    EdgelessGroupTitleEditor
  );
}

function registerMiscComponents() {
  // Modal and menu components
  customElements.define('affine-custom-modal', AffineCustomModal);

  // Loading and preview components
  customElements.define('loader-element', Loader);
  customElements.define('affine-template-loading', AffineTemplateLoading);

  // Toolbar and UI components
  customElements.define('affine-image-toolbar', AffineImageToolbar);
  customElements.define('edgeless-zoom-toolbar', EdgelessZoomToolbar);
  customElements.define('zoom-bar-toggle-button', ZoomBarToggleButton);
  customElements.define('overlay-scrollbar', OverlayScrollbar);

  // Auto-complete components
  customElements.define(
    'edgeless-auto-complete-panel',
    EdgelessAutoCompletePanel
  );
  customElements.define('edgeless-auto-complete', EdgelessAutoComplete);

  // Note and template components
  customElements.define(NOTE_SLICER_WIDGET, NoteSlicer);
  customElements.define('edgeless-templates-panel', EdgelessTemplatePanel);

  // Navigation components
  customElements.define(
    EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET,
    EdgelessNavigatorBlackBackgroundWidget
  );

  // Dragging area components
  customElements.define(
    EDGELESS_DRAGGING_AREA_WIDGET,
    EdgelessDraggingAreaRectWidget
  );
  customElements.define(
    EDGELESS_SELECTED_RECT_WIDGET,
    EdgelessSelectedRectWidget
  );

  // Mindmap components
  customElements.define('mindmap-import-placeholder', MindMapPlaceholder);
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-root': EdgelessRootBlockComponent;
    'affine-edgeless-root-preview': EdgelessRootPreviewBlockComponent;
    'edgeless-auto-complete-panel': EdgelessAutoCompletePanel;
    'edgeless-auto-complete': EdgelessAutoComplete;
    'note-slicer': NoteSlicer;
    'edgeless-font-family-panel': EdgelessFontFamilyPanel;
    'edgeless-font-weight-and-style-panel': EdgelessFontWeightAndStylePanel;
    'edgeless-scale-panel': EdgelessScalePanel;
    'edgeless-size-panel': EdgelessSizePanel;
    'stroke-style-panel': StrokeStylePanel;
    'edgeless-navigator-black-background': EdgelessNavigatorBlackBackgroundWidget;
    'edgeless-dragging-area-rect': EdgelessDraggingAreaRectWidget;
    'edgeless-selected-rect': EdgelessSelectedRectWidget;
    'edgeless-group-title-editor': EdgelessGroupTitleEditor;
    'edgeless-brush-menu': EdgelessBrushMenu;
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
    'edgeless-slide-menu': EdgelessSlideMenu;
    'toolbar-arrow-up-icon': ToolbarArrowUpIcon;
    'edgeless-default-tool-button': EdgelessDefaultToolButton;
    'edgeless-eraser-tool-button': EdgelessEraserToolButton;
    'edgeless-lasso-tool-button': EdgelessLassoToolButton;
    'edgeless-link-tool-button': EdgelessLinkToolButton;
    'mindmap-import-placeholder': MindMapPlaceholder;
    'edgeless-mindmap-menu': EdgelessMindmapMenu;
    'edgeless-mindmap-tool-button': EdgelessMindmapToolButton;
    'overlay-scrollbar': OverlayScrollbar;
    'affine-template-loading': AffineTemplateLoading;
    'edgeless-templates-panel': EdgelessTemplatePanel;
    'affine-page-root': PageRootBlockComponent;
    'zoom-bar-toggle-button': ZoomBarToggleButton;
    'edgeless-zoom-toolbar': EdgelessZoomToolbar;
    'affine-image-toolbar': AffineImageToolbar;

    [AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET]: AffineEdgelessZoomToolbarWidget;
    [AFFINE_IMAGE_TOOLBAR_WIDGET]: AffineImageToolbarWidget;
    [AFFINE_INNER_MODAL_WIDGET]: AffineInnerModalWidget;
  }
}
