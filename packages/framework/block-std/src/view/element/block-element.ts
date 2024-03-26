import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import type { Doc } from '@blocksuite/store';
import { nothing, type PropertyValues, render, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { html } from 'lit/static-html.js';

import type { EventName, UIEventHandler } from '../../event/index.js';
import type { BaseSelection } from '../../selection/index.js';
import type { BlockService } from '../../service/index.js';
import { PathFinder } from '../../utils/index.js';
import { WithDisposable } from '../utils/with-disposable.js';
import type { EditorHost } from './lit-host.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

export class BlockElement<
  Model extends BlockModel = BlockModel,
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
  doc!: Doc;

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
  service!: Service;

  path!: string[];

  get parentPath(): string[] {
    return this.path.slice(0, -1);
  }

  get parentBlockElement(): BlockElement {
    const parentBlock = this.doc.getParent(this.model);
    assertExists(parentBlock);
    const parentEl = this.host.view._blockMap.get(parentBlock.id);
    assertExists(parentEl);
    return parentEl;
  }

  get childBlockElements() {
    const childModels = this.model.children;
    return childModels
      .map(child => {
        return this.std.view._blockMap.get(child.id);
      })
      .filter((x): x is BlockElement => !!x);
  }

  get rootElement() {
    const rootElement = this.host.view.viewFromPath('block', [
      this.doc.root!.id,
    ]);
    assertExists(rootElement);
    return rootElement;
  }

  get topContenteditableElement(): BlockElement | null {
    return this.rootElement;
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

  get selection() {
    return this.host.selection;
  }

  get std() {
    return this.host.std;
  }

  get isVersionMismatch() {
    const schema = this.doc.schema.flavourSchemaMap.get(this.model.flavour);
    assertExists(
      schema,
      `Cannot find schema for flavour ${this.model.flavour}`
    );
    const expectedVersion = schema.version;
    const actualVersion = this.model.version;
    if (expectedVersion !== actualVersion) {
      console.warn(
        `Version mismatch for block ${this.model.id}, expected ${expectedVersion}, actual ${actualVersion}`
      );
      return true;
    }

    return false;
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
      path: options?.global || options?.flavour ? undefined : this.path,
    };
    this._disposables.add(this.host.event.bindHotkey(keymap, config));
  }

  renderChildren = (model: BlockModel): TemplateResult => {
    return this.host.renderChildren(model);
  };

  protected override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await Promise.all(this.childBlockElements.map(el => el.updateComplete));
    return result;
  }
  protected override update(changedProperties: PropertyValues): void {
    // In some cases, the DOM structure is directly modified, causing Lit to lose synchronization with the DOM structure.
    // We can restore this state through the `dirty` property.
    if (this.dirty) {
      // Here we made some hacks by referring to the source code of Lit.
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/lit-element/src/lit-element.ts#L162-L163
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/reactive-element/src/reactive-element.ts#L1586-L1589
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/reactive-element/src/reactive-element.ts#L1509-L1512
      //@ts-ignore
      this.__reflectingProperties &&= this.__reflectingProperties.forEach(p =>
        //@ts-ignore
        this.__propertyToAttribute(p, this[p as keyof this])
      ) as undefined;
      //@ts-ignore
      this._$changedProperties = new Map();
      this.isUpdatePending = false;
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

    this.std.view._blockMap.set(this.model.id, this);
    const disposable = this.std.doc.slots.blockUpdated.on(({ type, id }) => {
      if (id === this.model.id && type === 'delete') {
        this.std.view._blockMap.delete(this.model.id);
        disposable.dispose();
      }
    });

    this.service = this.host.std.spec.getService(this.model.flavour);
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

    this.service.specSlots.viewConnected.emit({
      service: this.service,
      component: this,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.service.specSlots.viewDisconnected.emit({
      service: this.service,
      component: this,
    });
  }

  renderBlock(): unknown {
    return nothing;
  }

  renderVersionMismatch(
    expectedVersion: number,
    actualVersion: number
  ): TemplateResult {
    return html`
      <dl class="version-mismatch-warning" contenteditable="false">
        <dt>
          <h4>Block Version Mismatched</h4>
        </dt>
        <dd>
          <p>
            We can not render this <var>${this.model.flavour}</var> block
            because the version is mismatched.
          </p>
          <p>Editor version: <var>${expectedVersion}</var></p>
          <p>Data version: <var>${actualVersion}</var></p>
        </dd>
      </dl>
    `;
  }

  override render() {
    return when(
      this.isVersionMismatch,
      () => {
        const schema = this.doc.schema.flavourSchemaMap.get(this.model.flavour);
        assertExists(
          schema,
          `Cannot find schema for flavour ${this.model.flavour}`
        );
        const expectedVersion = schema.version;
        const actualVersion = this.model.version;
        return this.renderVersionMismatch(expectedVersion, actualVersion);
      },
      () => this.renderBlock()
    );
  }
}
