import { SeniorToolExtension } from '@labre/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const edgySeniorTool = SeniorToolExtension('edgy', ({ block }) => {
  return {
    name: 'EDGY',
    content: html`<edgeless-edgy-senior-button
      .edgeless=${block}
    ></edgeless-edgy-senior-button>`,
  };
});
