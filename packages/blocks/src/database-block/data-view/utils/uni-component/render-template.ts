import type { TemplateResult } from 'lit';

import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { customElement, property } from 'lit/decorators.js';

@customElement('any-render')
export class AnyRender<T> extends SignalWatcher(ShadowlessElement) {
  override render() {
    return this.renderTemplate(this.props);
  }

  @property({ attribute: false })
  accessor props!: T;

  @property({ attribute: false })
  accessor renderTemplate!: (props: T) => TemplateResult | symbol;
}

export const renderTemplate = <T>(
  renderTemplate: (props: T) => TemplateResult | symbol
) => {
  const ins = new AnyRender<T>();
  ins.renderTemplate = renderTemplate;
  return ins;
};
