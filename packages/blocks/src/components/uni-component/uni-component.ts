import { ShadowlessElement } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type UniComponentReturn<
  Props = NonNullable<unknown>,
  Expose extends NonNullable<unknown> = NonNullable<unknown>
> = {
  update: (props: Props) => void;
  unmount: () => void;
  expose: Expose;
};
export type UniComponent<
  Props = NonNullable<unknown>,
  Expose extends NonNullable<unknown> = NonNullable<unknown>
> = (ele: HTMLElement, props: Props) => UniComponentReturn<Props, Expose>;

@customElement('uni-lit')
export class UniLit<
  Expose extends NonNullable<unknown>
> extends ShadowlessElement {
  @property()
  uni!: UniComponent<unknown, Expose>;

  @property()
  props!: NonNullable<unknown>;

  uniReturn?: UniComponentReturn<unknown, Expose>;

  get expose(): Expose | undefined {
    return this.uniReturn?.expose;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.uniReturn = this.uni(this, this.props);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.uniReturn?.unmount();
  }

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (_changedProperties.has('props')) {
      this.uniReturn?.update(this.props);
    }
  }

  protected override render(): unknown {
    return html``;
  }
}

export const createUniComponentFromWebComponent = <
  T,
  Expose extends Record<string, unknown>
>(
  component: typeof HTMLElement
): UniComponent<T, Expose> => {
  return (ele, props) => {
    const ins = new component();
    Object.assign(ins, props);
    ele.appendChild(ins);
    return {
      update: props => {
        Object.assign(ins, props);
      },
      unmount: () => {
        ins.remove();
      },
      expose: ins as never as Expose,
    };
  };
};
