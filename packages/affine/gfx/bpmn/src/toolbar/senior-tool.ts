import { SeniorToolExtension } from '@labre/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const bpmnSeniorTool = SeniorToolExtension('bpmn', ({ block }) => {
  return {
    name: 'BPMN',
    content: html`<edgeless-bpmn-senior-button
      .edgeless=${block}
    ></edgeless-bpmn-senior-button>`,
  };
});
