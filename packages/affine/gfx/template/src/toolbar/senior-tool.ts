import { SeniorToolExtension } from '@labre/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const templateSeniorTool = SeniorToolExtension(
  'template',
  ({ block }) => {
    return {
      name: 'Template',
      // Render after every framework senior tool (default order is 0).
      order: 100,
      content: html`<edgeless-template-button .edgeless=${block}>
      </edgeless-template-button>`,
    };
  }
);
