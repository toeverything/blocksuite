import { type TemplateResult, html } from 'lit';

import type { Menu } from '../../../../_common/components/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import type { EdgelessTool } from '../../types.js';

import './brush/brush-tool-button.js';
import { buildConnectorDenseMenu } from './connector/connector-dense-menu.js';
// import './lasso/lasso-tool-button.js';
import './connector/connector-tool-button.js';
import './default/default-tool-button.js';
import './eraser/eraser-tool-button.js';
import { buildFrameDenseMenu } from './frame/frame-dense-menu.js';
import './frame/frame-tool-button.js';
import { buildLinkDenseMenu } from './link/link-dense-menu.js';
import './link/link-tool-button.js';
import './mindmap/mindmap-tool-button.js';
// import './image/image-tool-button.js';
import './note/note-senior-button.js';
// import './present/present-button.js';
import './note/note-tool-button.js';
import './shape/shape-tool-button.js';
// import './text/text-tool-button.js';
import './template/template-tool-button.js';

export interface QuickTool {
  type?: EdgelessTool['type'];
  content: TemplateResult;
  /**
   * if not configured, the tool will not be shown in dense mode
   */
  menu?: Menu;
}
export interface SeniorTool {
  /**
   * Used to show in nav-button's tooltip
   */
  name: string;
  content: TemplateResult;
}

/**
 * Get quick-tool list
 */
export const getQuickTools = ({
  edgeless,
}: {
  edgeless: EdgelessRootBlockComponent;
}) => {
  const { doc } = edgeless;
  const quickTools: QuickTool[] = [];

  // 🔧 Hands / Pointer
  quickTools.push({
    type: 'default',
    content: html`<edgeless-default-tool-button
      .edgeless=${edgeless}
    ></edgeless-default-tool-button>`,
    // menu: will never show because the first tool will never hide
  });

  // 🔧 Lasso
  // if (doc.awarenessStore.getFlag('enable_lasso_tool')) {
  //   quickTools.push({
  //     type: 'lasso',
  //     content: html`<edgeless-lasso-tool-button
  //       .edgeless=${edgeless}
  //     ></edgeless-lasso-tool-button>`,
  //     menu: buildLassoDenseMenu(edgeless),
  //   });
  // }

  // 🔧 Frame
  if (!doc.readonly) {
    quickTools.push({
      type: 'frame',
      content: html`<edgeless-frame-tool-button
        .edgeless=${edgeless}
      ></edgeless-frame-tool-button>`,
      menu: buildFrameDenseMenu(edgeless),
    });
  }

  // 🔧 Connector
  quickTools.push({
    type: 'connector',
    content: html`<edgeless-connector-tool-button
      .edgeless=${edgeless}
    ></edgeless-connector-tool-button>`,
    menu: buildConnectorDenseMenu(edgeless),
  });

  // 🔧 Present
  // quickTools.push({
  //   type: 'frameNavigator',
  //   content: html`<edgeless-present-button
  //     .edgeless=${edgeless}
  //   ></edgeless-present-button>`,
  // });

  // 🔧 Note
  // if (!doc.readonly) {
  //   quickTools.push({
  //     type: 'affine:note',
  //     content: html`
  //       <edgeless-note-tool-button
  //         .edgeless=${edgeless}
  //       ></edgeless-note-tool-button>
  //     `,
  //   });
  // }

  // Link
  quickTools.push({
    content: html`<edgeless-link-tool-button
      .edgeless=${edgeless}
    ></edgeless-link-tool-button>`,
    menu: buildLinkDenseMenu(edgeless),
  });
  return quickTools;
};

export const getSeniorTools = ({
  edgeless,
  toolbarContainer,
}: {
  edgeless: EdgelessRootBlockComponent;
  toolbarContainer: HTMLElement;
}): SeniorTool[] => {
  const { doc } = edgeless;
  const tools: SeniorTool[] = [];

  if (!doc.readonly) {
    tools.push({
      name: 'Note',
      content: html`<edgeless-note-senior-button .edgeless=${edgeless}>
      </edgeless-note-senior-button>`,
    });
  }

  // Brush / Eraser
  tools.push({
    name: 'Pen',
    content: html`<div class="brush-and-eraser">
      <edgeless-brush-tool-button
        .edgeless=${edgeless}
      ></edgeless-brush-tool-button>

      <edgeless-eraser-tool-button
        .edgeless=${edgeless}
      ></edgeless-eraser-tool-button>
    </div> `,
  });

  // Shape
  tools.push({
    name: 'Shape',
    content: html`<edgeless-shape-tool-button
      .edgeless=${edgeless}
      .toolbarContainer=${toolbarContainer}
    ></edgeless-shape-tool-button>`,
  });

  tools.push({
    name: 'Mind Map',
    content: html`<edgeless-mindmap-tool-button
      .edgeless=${edgeless}
      .toolbarContainer=${toolbarContainer}
    ></edgeless-mindmap-tool-button>`,
  });

  // // Text
  // tools.push({
  //   content: html`<edgeless-text-tool-button .edgeless=${edgeless}>
  //   </edgeless-text-tool-button>`,
  // });

  // // Image
  // tools.push({
  //   content: html`<edgeless-image-tool-button
  //     .edgeless=${edgeless}
  //   ></edgeless-image-tool-button>`,
  // });

  // Template
  tools.push({
    name: 'Template',
    content: html`<edgeless-template-button .edgeless=${edgeless}>
    </edgeless-template-button>`,
  });

  return tools;
};
