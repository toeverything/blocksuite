/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import {
  BlockSuiteError,
  ErrorCode,
  handleError,
} from '@blocksuite/global/exceptions';
import { Slot } from '@blocksuite/global/utils';
import { Doc } from '@blocksuite/store';
import { type BlockModel, BlockViewType } from '@blocksuite/store';
import { createContext, provide } from '@lit/context';
import { SignalWatcher } from '@lit-labs/preact-signals';
import {
  LitElement,
  type PropertyValues,
  type TemplateResult,
  css,
  nothing,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { type StaticValue, html, unsafeStatic } from 'lit/static-html.js';

import type { CommandManager } from '../../command/index.js';
import type { UIEventDispatcher } from '../../event/index.js';
import type { RangeManager } from '../../range/index.js';
import type { SelectionManager } from '../../selection/index.js';
import type { BlockSpec, SpecStore } from '../../spec/index.js';
import type { ViewStore } from '../view-store.js';

import { BlockStdScope } from '../../scope/block-std-scope.js';
import { PropTypes, requiredProperties } from '../decorators/required.js';
import { WithDisposable } from '../utils/with-disposable.js';
import { ShadowlessElement } from './shadowless-element.js';

export const docContext = createContext<Doc>('doc');
export const stdContext = createContext<BlockStdScope>('std');

@requiredProperties({
  doc: PropTypes.instanceOf(Doc),
  std: PropTypes.instanceOf(BlockStdScope),
  specs: PropTypes.arrayOf(PropTypes.object),
})
@customElement('editor-host')
export class EditorHost extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _renderModel = (model: BlockModel): TemplateResult => {
    const { flavour } = model;
    const block = this.doc.getBlock(model.id);
    if (!block || block.blockViewType === BlockViewType.Hidden) {
      return html`${nothing}`;
    }
    const schema = this.doc.schema.flavourSchemaMap.get(flavour);
    const view = this.std.spec.getView(flavour);
    if (!schema || !view) {
      console.warn(`Cannot find render flavour ${flavour}.`);
      return html`${nothing}`;
    }

    const tag =
      typeof view.component === 'function'
        ? view.component(model)
        : view.component;
    const widgets: Record<string, TemplateResult> = view.widgets
      ? Object.entries(view.widgets).reduce((mapping, [key, tag]) => {
          const template = html`<${tag} ${unsafeStatic(this.widgetIdAttr)}=${key}></${tag}>`;

          return {
            ...mapping,
            [key]: template,
          };
        }, {})
      : {};

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .widgets=${widgets}
      .viewType=${block.blockViewType}
    ></${tag}>`;
  };

  static override styles = css`
    editor-host {
      outline: none;
      isolation: isolate;
    }
  `;

  renderChildren = (model: BlockModel): TemplateResult => {
    return html`${repeat(
      model.children,
      child => child.id,
      child => this._renderModel(child)
    )}`;
  };

  /**
   * @deprecated
   *
   * This method is deprecated. Use `renderSpecPortal` instead.
   */
  renderModel = (model: BlockModel): TemplateResult => {
    return this._renderModel(model);
  };

  renderSpecPortal = (doc: Doc, specs: BlockSpec[]) => {
    return html`
      <editor-host
        .doc=${doc}
        .specs=${specs}
        contenteditable="false"
      ></editor-host>
    `;
  };

  readonly slots = {
    unmounted: new Slot(),
  };

  override connectedCallback() {
    super.connectedCallback();

    if (!this.doc.root) {
      throw new BlockSuiteError(
        ErrorCode.NoRootModelError,
        'This doc is missing root block. Please initialize the default block structure before connecting the editor to DOM.'
      );
    }

    this.std = new BlockStdScope({
      host: this,
      doc: this.doc,
    });

    this.std.mount();
    this.std.spec.applySpecs(this.specs);
    this.tabIndex = 0;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.std.unmount();
    this.slots.unmounted.emit();
  }

  override async getUpdateComplete(): Promise<boolean> {
    try {
      const result = await super.getUpdateComplete();
      const rootModel = this.doc.root;
      if (!rootModel) return result;

      const view = this.std.spec.getView(rootModel.flavour);
      if (!view) return result;

      const widgetTags = Object.values(view.widgets ?? {});
      const elementsTags: StaticValue[] = [
        typeof view.component === 'function'
          ? view.component(rootModel)
          : view.component,
        ...widgetTags,
      ];
      await Promise.all(
        elementsTags.map(tag => {
          const element = this.renderRoot.querySelector(tag._$litStatic$);
          if (element instanceof LitElement) {
            return element.updateComplete;
          }
          return;
        })
      );
      return result;
    } catch (e) {
      if (e instanceof Error) {
        handleError(e);
      } else {
        console.error(e);
      }
      return true;
    }
  }

  override render() {
    const { root } = this.doc;
    if (!root) return nothing;

    return this._renderModel(root);
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('specs')) {
      this.std.spec.applySpecs(this.specs);
    }
    super.willUpdate(changedProperties);
  }

  get command(): CommandManager {
    return this.std.command;
  }

  get event(): UIEventDispatcher {
    return this.std.event;
  }

  get range(): RangeManager {
    return this.std.range;
  }

  get selection(): SelectionManager {
    return this.std.selection;
  }

  get spec(): SpecStore {
    return this.std.spec;
  }

  get view(): ViewStore {
    return this.std.view;
  }

  @property({ attribute: false })
  accessor blockIdAttr = 'data-block-id';

  @provide({ context: docContext })
  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs!: BlockSpec[];

  @provide({ context: stdContext })
  @state()
  accessor std!: BlockSuite.Std;

  @property({ attribute: false })
  accessor widgetIdAttr = 'data-widget-id';
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-host': EditorHost;
  }
}
