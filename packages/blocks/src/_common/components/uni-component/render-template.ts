import { ShadowlessElement } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('any-render')
export class AnyRender<T> extends ShadowlessElement {
  @property({ attribute: false })
  props!: T;
  @property({ attribute: false })
  renderTemplate!: (props: T) => TemplateResult | symbol;

  override render() {
    return this.renderTemplate(this.props);
  }
}

export const renderTemplate = <T>(
  renderTemplate: (props: T) => TemplateResult | symbol
) => {
  const ins = new AnyRender<T>();
  ins.renderTemplate = renderTemplate;
  return ins;
};
