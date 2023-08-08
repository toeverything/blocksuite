import { ShadowlessElement } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Ref } from 'lit/directives/ref.js';

export type UniComponentReturn<
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
  @property({ attribute: false })
  uni?: UniComponent<unknown, Expose>;

  @property({ attribute: false })
  props!: NonNullable<unknown>;
  @property({ attribute: false })
  ref?: Ref<Expose>;

  uniReturn?: UniComponentReturn<unknown, Expose>;

  get expose(): Expose | undefined {
    return this.uniReturn?.expose;
  }

  private mount() {
    this.uniReturn = this.uni?.(this, this.props);
    if (this.ref) {
      // @ts-expect-error
      this.ref.value = this.uniReturn?.expose;
    }
  }

  private unmount() {
    this.uniReturn?.unmount();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.mount();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unmount();
  }

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (_changedProperties.has('uni')) {
      this.unmount();
      this.mount();
    } else if (_changedProperties.has('props')) {
      this.uniReturn?.update(this.props);
    }
  }

  protected override render(): unknown {
    return html``;
  }
}

export const createUniComponentFromWebComponent = <
  T,
  Expose extends NonNullable<unknown> = NonNullable<unknown>
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
