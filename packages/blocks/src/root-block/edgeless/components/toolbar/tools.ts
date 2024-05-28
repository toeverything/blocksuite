import './default/default-tool-button.js';
import './lasso/lasso-tool-button.js';
import './connector/connector-tool-button.js';
import './frame/frame-tool-button.js';
import './present/present-button.js';
import './note/note-tool-button.js';
import './brush/brush-tool-button.js';
import './eraser/eraser-tool-button.js';
import './shape/shape-tool-button.js';
import './text/text-tool-button.js';
import './template/template-tool-button.js';
import './image/image-tool-button.js';

import { html, type TemplateResult } from 'lit';

import type { Menu } from '../../../../_common/components/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { buildConnectorDenseMenu } from './connector/connector-dense-menu.js';
import { buildFrameDenseMenu } from './frame/frame-dense-menu.js';
import { buildLassoDenseMenu } from './lasso/lasso-dense-menu.js';

export interface QuickTool {
  content: TemplateResult;
  /**
   * if not configured, the tool will not be shown in dense mode
   */
  menu?: Menu;
}
export interface SeniorTool {
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
    content: html`<edgeless-default-tool-button
      .edgeless=${edgeless}
    ></edgeless-default-tool-button>`,
    // menu: will never show because the first tool will never hide
  });

  // 🔧 Lasso
  if (doc.awarenessStore.getFlag('enable_lasso_tool')) {
    quickTools.push({
      content: html`<edgeless-lasso-tool-button
        .edgeless=${edgeless}
      ></edgeless-lasso-tool-button>`,
      menu: buildLassoDenseMenu(edgeless),
    });
  }

  // 🔧 Connector
  quickTools.push({
    content: html`<edgeless-connector-tool-button
      .edgeless=${edgeless}
    ></edgeless-connector-tool-button>`,
    menu: buildConnectorDenseMenu(edgeless),
  });

  // 🔧 Frame
  if (!doc.readonly) {
    quickTools.push({
      content: html`<edgeless-frame-tool-button
        .edgeless=${edgeless}
      ></edgeless-frame-tool-button>`,
      menu: buildFrameDenseMenu(edgeless),
    });
  }

  // 🔧 Present
  quickTools.push({
    content: html`<edgeless-present-button
      .edgeless=${edgeless}
    ></edgeless-present-button>`,
  });

  // 🔧 Note
  if (!doc.readonly) {
    quickTools.push({
      content: html`
        <edgeless-note-tool-button
          .edgeless=${edgeless}
        ></edgeless-note-tool-button>
      `,
    });
  }
  return quickTools;
};

export const getSeniorTools = ({
  edgeless,
}: {
  edgeless: EdgelessRootBlockComponent;
}): SeniorTool[] => {
  return [
    // Brush / Eraser
    {
      content: html`<div class="brush-and-eraser">
        <edgeless-brush-tool-button
          .edgeless=${edgeless}
        ></edgeless-brush-tool-button>

        <edgeless-eraser-tool-button
          .edgeless=${edgeless}
        ></edgeless-eraser-tool-button>
      </div> `,
    },

    // Shape
    {
      content: html`<edgeless-shape-tool-button
        .edgeless=${edgeless}
      ></edgeless-shape-tool-button>`,
    },

    // Text
    {
      content: html`<edgeless-text-tool-button .edgeless=${edgeless}>
      </edgeless-text-tool-button>`,
    },

    // Image
    {
      content: html`<edgeless-image-tool-button
        .edgeless=${edgeless}
      ></edgeless-image-tool-button>`,
    },

    // Template
    {
      content: html`<edgeless-template-button .edgeless=${edgeless}>
      </edgeless-template-button>`,
    },
  ];
};
