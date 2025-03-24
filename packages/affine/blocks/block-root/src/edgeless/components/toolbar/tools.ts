import { frameQuickTool } from '@blocksuite/affine-block-frame';
import { connectorQuickTool } from '@blocksuite/affine-gfx-connector';
import { noteSeniorTool } from '@blocksuite/affine-gfx-note';
import { shapeSeniorTool } from '@blocksuite/affine-gfx-shape';
import {
  QuickToolExtension,
  SeniorToolExtension,
} from '@blocksuite/affine-widget-edgeless-toolbar';
import { html } from 'lit';

import { buildLinkDenseMenu } from './link/link-dense-menu.js';

const defaultQuickTool = QuickToolExtension('default', ({ block }) => {
  return {
    type: 'default',
    content: html`<edgeless-default-tool-button
      .edgeless=${block}
    ></edgeless-default-tool-button>`,
  };
});

const linkQuickTool = QuickToolExtension('link', ({ block, gfx }) => {
  return {
    content: html`<edgeless-link-tool-button
      .edgeless=${block}
    ></edgeless-link-tool-button>`,
    menu: buildLinkDenseMenu(block, gfx),
  };
});

const penSeniorTool = SeniorToolExtension('pen', ({ block }) => {
  return {
    name: 'Pen',
    content: html`<div class="brush-and-eraser">
      <edgeless-brush-tool-button
        .edgeless=${block}
      ></edgeless-brush-tool-button>

      <edgeless-eraser-tool-button
        .edgeless=${block}
      ></edgeless-eraser-tool-button>
    </div> `,
  };
});

const mindMapSeniorTool = SeniorToolExtension(
  'mindMap',
  ({ block, toolbarContainer }) => {
    return {
      name: 'Mind Map',
      content: html`<edgeless-mindmap-tool-button
        .edgeless=${block}
        .toolbarContainer=${toolbarContainer}
      ></edgeless-mindmap-tool-button>`,
    };
  }
);

const templateSeniorTool = SeniorToolExtension('template', ({ block }) => {
  return {
    name: 'Template',
    content: html`<edgeless-template-button .edgeless=${block}>
    </edgeless-template-button>`,
  };
});

export const quickTools = [
  defaultQuickTool,
  frameQuickTool,
  connectorQuickTool,
  linkQuickTool,
];

export const seniorTools = [
  noteSeniorTool,
  penSeniorTool,
  shapeSeniorTool,
  mindMapSeniorTool,
  templateSeniorTool,
];
