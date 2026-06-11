import { SeniorToolExtension } from '@labre/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const wardleySeniorTool = SeniorToolExtension('wardley', ({ block }) => {
  return {
    name: 'Wardley map',
    content: html`<edgeless-wardley-senior-button
      .edgeless=${block}
    ></edgeless-wardley-senior-button>`,
  };
});
