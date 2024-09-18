import {
  DocModeService,
  EmbedOptionService,
} from '@blocksuite/affine-shared/services';
import { AFFINE_SCROLL_ANCHORING_WIDGET } from '@blocksuite/affine-widget-scroll-anchoring';
import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  WidgetViewMapExtension,
} from '@blocksuite/block-std';
import { BlockServiceWatcher, FlavourExtension } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { ExportManagerExtension } from '../../_common/export-manager/export-manager.js';
import { commands } from '../commands/index.js';
import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../widgets/doc-remote-selection/doc-remote-selection.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../widgets/drag-handle/consts.js';
import { AFFINE_EDGELESS_AUTO_CONNECT_WIDGET } from '../widgets/edgeless-auto-connect/edgeless-auto-connect.js';
import { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET } from '../widgets/edgeless-remote-selection/index.js';
import { AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET } from '../widgets/edgeless-zoom-toolbar/index.js';
import { AFFINE_EMBED_CARD_TOOLBAR_WIDGET } from '../widgets/embed-card-toolbar/embed-card-toolbar.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../widgets/format-bar/format-bar.js';
import { EDGELESS_ELEMENT_TOOLBAR_WIDGET } from '../widgets/index.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../widgets/inner-modal/inner-modal.js';
import { AFFINE_LINKED_DOC_WIDGET } from '../widgets/linked-doc/index.js';
import { AFFINE_MODAL_WIDGET } from '../widgets/modal/modal.js';
import { AFFINE_PIE_MENU_WIDGET } from '../widgets/pie-menu/index.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../widgets/slash-menu/index.js';
import { AFFINE_VIEWPORT_OVERLAY_WIDGET } from '../widgets/viewport-overlay/viewport-overlay.js';
import { EdgelessRootService } from './edgeless-root-service.js';

export const edgelessRootWigetViewMap = {
  [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
  [AFFINE_INNER_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_INNER_MODAL_WIDGET)}`,
  [AFFINE_PIE_MENU_WIDGET]: literal`${unsafeStatic(AFFINE_PIE_MENU_WIDGET)}`,
  [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
    AFFINE_SLASH_MENU_WIDGET
  )}`,
  [AFFINE_LINKED_DOC_WIDGET]: literal`${unsafeStatic(
    AFFINE_LINKED_DOC_WIDGET
  )}`,
  [AFFINE_DRAG_HANDLE_WIDGET]: literal`${unsafeStatic(
    AFFINE_DRAG_HANDLE_WIDGET
  )}`,
  [AFFINE_EMBED_CARD_TOOLBAR_WIDGET]: literal`${unsafeStatic(
    AFFINE_EMBED_CARD_TOOLBAR_WIDGET
  )}`,
  [AFFINE_FORMAT_BAR_WIDGET]: literal`${unsafeStatic(
    AFFINE_FORMAT_BAR_WIDGET
  )}`,
  [AFFINE_DOC_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
    AFFINE_DOC_REMOTE_SELECTION_WIDGET
  )}`,
  [AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
    AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET
  )}`,
  [AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET]: literal`${unsafeStatic(
    AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET
  )}`,
  [EDGELESS_ELEMENT_TOOLBAR_WIDGET]: literal`${unsafeStatic(EDGELESS_ELEMENT_TOOLBAR_WIDGET)}`,
  [AFFINE_VIEWPORT_OVERLAY_WIDGET]: literal`${unsafeStatic(
    AFFINE_VIEWPORT_OVERLAY_WIDGET
  )}`,
  [AFFINE_EDGELESS_AUTO_CONNECT_WIDGET]: literal`${unsafeStatic(
    AFFINE_EDGELESS_AUTO_CONNECT_WIDGET
  )}`,
  [AFFINE_SCROLL_ANCHORING_WIDGET]: literal`${unsafeStatic(AFFINE_SCROLL_ANCHORING_WIDGET)}`,
};

const EdgelessCommonExtension: ExtensionType[] = [
  FlavourExtension('affine:page'),
  EdgelessRootService,
  DocModeService,
  EmbedOptionService,
  CommandExtension(commands),
  ExportManagerExtension,
];

export const EdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root`),
  WidgetViewMapExtension('affine:page', edgelessRootWigetViewMap),
];

class EdgelessLocker extends BlockServiceWatcher {
  static override readonly flavour = 'affine:page';

  override mounted() {
    const service = this.blockService;
    service.disposables.add(
      service.specSlots.viewConnected.on(({ service }) => {
        // Does not allow the user to move and zoom.
        (service as EdgelessRootService).locked = true;
      })
    );
  }
}

export const PreviewEdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root-preview`),
  EdgelessLocker,
];
