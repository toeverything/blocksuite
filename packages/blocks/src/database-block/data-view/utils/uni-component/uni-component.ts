import { ShadowlessElement } from '@blocksuite/block-std';
import type { LitElement, PropertyValues, TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Ref } from 'lit/directives/ref.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

export type UniComponentReturn<
  Props = NonNullable<unknown>,
  Expose extends NonNullable<unknown> = NonNullable<unknown>,
> = {
  update: (props: Props) => void;
  unmount: () => void;
  expose: Expose;
};
export type UniComponent<
  Props = NonNullable<unknown>,
  Expose extends NonNullable<unknown> = NonNullable<unknown>,
> = (ele: HTMLElement, props: Props) => UniComponentReturn<Props, Expose>;
export const renderUniLit = <Props, Expose extends NonNullable<unknown>>(
  uni: UniComponent<Props, Expose> | undefined,
  props: Props,
  options?: {
    ref?: Ref<Expose>;
    style?: Readonly<StyleInfo>;
    class?: string;
  }
): TemplateResult => {
  return html` <uni-lit
    .uni="${uni}"
    .props="${props}"
    .ref="${options?.ref}"
    style=${options?.style ? styleMap(options?.style) : ''}
  ></uni-lit>`;
};

@customElement('uni-lit')
export class UniLit<
  Props,
  Expose extends NonNullable<unknown> = NonNullable<unknown>,
> extends ShadowlessElement {
  get expose(): Expose | undefined {
    return this.uniReturn?.expose;
  }

  static override styles = css`
    uni-lit {
      display: contents;
    }
  `;

  @property({ attribute: false })
  accessor uni: UniComponent<Props, Expose> | undefined = undefined;

  @property({ attribute: false })
  accessor props!: Props;

  @property({ attribute: false })
  accessor ref: Ref<Expose> | undefined = undefined;

  uniReturn?: UniComponentReturn<Props, Expose>;

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

  override connectedCallback() {
    super.connectedCallback();
    this.mount();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unmount();
  }
}

export const createUniComponentFromWebComponent = <
  T,
  Expose extends NonNullable<unknown> = NonNullable<unknown>,
>(
  component: typeof LitElement
): UniComponent<T, Expose> => {
  return (ele, props) => {
    const ins = new component();
    Object.assign(ins, props);
    ele.append(ins);
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

@customElement('uni-any-render')
class UniAnyRender<
  T,
  Expose extends NonNullable<unknown>,
> extends ShadowlessElement {
  @property({ attribute: false })
  accessor props!: T;

  @property({ attribute: false })
  accessor expose!: Expose;

  @property({ attribute: false })
  accessor renderTemplate!: (props: T, expose: Expose) => TemplateResult;

  override render() {
    return this.renderTemplate(this.props, this.expose);
  }
}
export const defineUniComponent = <T, Expose extends NonNullable<unknown>>(
  renderTemplate: (props: T, expose: Expose) => TemplateResult
): UniComponent<T, Expose> => {
  return (ele, props) => {
    const ins = new UniAnyRender<T, Expose>();
    ins.props = props;
    ins.expose = {} as Expose;
    ins.renderTemplate = renderTemplate;
    ele.append(ins);
    return {
      update: props => {
        ins.props = props;
      },
      unmount: () => {
        ins.remove();
      },
      expose: ins.expose,
    };
  };
};
