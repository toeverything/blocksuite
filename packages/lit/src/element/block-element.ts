import type { BlockService } from '@blocksuite/block-std';
import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Page } from '@blocksuite/store';
import { nothing, type PropertyValues, render, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { EditorHost } from './lit-host.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

export class BlockElement<
  Model extends BaseBlockModel = BaseBlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  model!: Model;

  @property({ attribute: false })
  content: TemplateResult | null = null;

  @property({
    attribute: false,
    hasChanged(value, oldValue) {
      if (!value || !oldValue) {
        return value !== oldValue;
      }
      // Is empty object
      if (!Object.keys(value).length && !Object.keys(oldValue).length) {
        return false;
      }
      return value !== oldValue;
    },
  })
  widgets!: Record<WidgetName, TemplateResult>;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  dirty = false;

  @state({
    hasChanged(value: BaseSelection | null, oldValue: BaseSelection | null) {
      if (!value || !oldValue) {
        return value !== oldValue;
      }

      return !value?.equals(oldValue);
    },
  })
  selected: BaseSelection | null = null;

  path!: string[];

  get parentPath(): string[] {
    return this.path.slice(0, -1);
  }

  get parentBlockElement() {
    const parentElement = this.parentElement;
    assertExists(parentElement);
    const nodeView = this.host.view.getNodeView(parentElement);
    assertExists(nodeView);
    return nodeView.view as BlockElement;
  }

  get childBlockElements() {
    const children = this.host.view.getChildren(this.path);
    return children
      .filter(child => child.type === 'block')
      .map(child => child.view as BlockElement);
  }

  get rootBlockElement() {
    const rootElement = this.host.view.viewFromPath(
      'block',
      this.path.slice(0, 1)
    );
    assertExists(rootElement);
    return rootElement;
  }

  get topContenteditableElement() {
    return this.rootBlockElement;
  }

  get flavour(): string {
    return this.model.flavour;
  }

  get widgetElements(): Partial<Record<WidgetName, WidgetElement>> {
    return Object.keys(this.widgets).reduce((mapping, key) => {
      return {
        ...mapping,
        [key]: this.host.view.viewFromPath('widget', [...this.path, key]),
      };
    }, {});
  }

  get service(): Service | undefined {
    return this.host.std.spec.getService(this.model.flavour) as
      | Service
      | undefined;
  }

  get selection() {
    return this.host.selection;
  }

  get std() {
    return this.host.std;
  }

  handleEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean; flavour?: boolean }
  ) => {
    assertExists(this.path, 'Cannot bind block level hotkey without path');
    const config = {
      flavour: options?.global
        ? undefined
        : options?.flavour
          ? this.model.flavour
          : undefined,
      path: options?.global || options?.flavour ? undefined : this.path,
    };
    this._disposables.add(this.host.event.add(name, handler, config));
  };

  bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global?: boolean; flavour?: boolean }
  ) {
    assertExists(this.path, 'Cannot bind block level hotkey without path');
    const config = {
      flavour: options?.global
        ? undefined
        : options?.flavour
          ? this.model.flavour
          : undefined,
      path:
        options?.global || options?.flavour
          ? undefined
          : this.topContenteditableElement.path,
    };
    this._disposables.add(this.host.event.bindHotkey(keymap, config));
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    return this.host.renderModel(model);
  };

  renderModelChildren = (model: BaseBlockModel): TemplateResult => {
    return this.host.renderModelChildren(model);
  };

  protected override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await Promise.all(this.childBlockElements.map(el => el.updateComplete));
    return result;
  }
  protected override update(changedProperties: PropertyValues): void {
    if (this.dirty) {
      //@ts-ignore
      this.__reflectingProperties &&= this.__reflectingProperties.forEach(p =>
        //@ts-ignore
        this.__propertyToAttribute(p, this[p as keyof this])
      ) as undefined;
      //@ts-ignore
      this.__markUpdated();
      //@ts-ignore
      this.__childPart = render(nothing, this.renderRoot);

      this.updateComplete
        .then(() => {
          this.dirty = false;
        })
        .catch(console.error);
    } else {
      super.update(changedProperties);
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    this.path = this.host.view.calculatePath(this);

    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.host.selection.slots.changed.on(selections => {
        const selection = selections.find(selection => {
          return PathFinder.equals(selection.path, this.path);
        });

        if (!selection) {
          this.selected = null;
          return;
        }

        this.selected = selection;
      })
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override render(): unknown {
    return null;
  }
}
