import { EdgelessBpmnMenu } from './toolbar/bpmn-menu';
import { EdgelessBpmnSeniorButton } from './toolbar/bpmn-senior-button';

export function effects() {
  customElements.define('edgeless-bpmn-menu', EdgelessBpmnMenu);
  customElements.define('edgeless-bpmn-senior-button', EdgelessBpmnSeniorButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-bpmn-menu': EdgelessBpmnMenu;
    'edgeless-bpmn-senior-button': EdgelessBpmnSeniorButton;
  }
}
