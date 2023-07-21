import type { BlockService } from '@blocksuite/block-std';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';

// TODO: remove this
export type FocusContext<
  Model extends BaseBlockModel = BaseBlockModel,
  Service extends BlockService = BlockService
> = (
  | {
      multi?: false;
    }
  | {
      /**
       * Please note that this parameter only suggests that the operation is a multi-select operation,
       * and does not mean that multiple blocks will be selected every time.
       *
       * For example, select all blocks by pressing `Ctrl+A` or clicking the drag handler.
       */
      multi: true;
      /**
       * Please check the length of the array before using it.
       */
      blocks: BlockElement<BaseBlockModel>;
    }
) &
  (
    | {
        type: 'pointer';
        event: PointerEvent;
      }
    | {
        type: 'keyboard';
        event: KeyboardEvent;
      }
    | {
        // Please update the type name
        // for example, 'api' or 'others'
        type: 'UNKNOWN';
        // TODO: add more information
      }
  );

export class BlockElement<
  Model extends BaseBlockModel = BaseBlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
  FocusCtx extends FocusContext<Model, Service> = FocusContext<Model, Service>
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  model!: Model;

  @property({ attribute: false })
  content!: TemplateResult;

  @property({ attribute: false })
  widgets!: Record<WidgetName, TemplateResult>;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  path!: string[];

  get pathName(): string {
    return this.path.join('|');
  }

  get parentPath(): string[] {
    return this.path.slice(0, -1);
  }

  get parentBlockElement() {
    return this.root.blockViewMap.get(this.parentPath.join('|'));
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    return this.root.renderModel(model, this.path);
  };

  get service(): Service | undefined {
    return this.root.blockStore.getService(this.model.flavour) as
      | Service
      | undefined;
  }

  // TODO: remove this
  focusBlock(focusContext: FocusCtx): boolean {
    // Return false to prevent default focus behavior
    return true;
  }

  // TODO: remove this
  blurBlock(focusContext: FocusCtx): boolean {
    // Return false to prevent default focus behavior
    return true;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.root.blockViewMap.set(this.pathName, this);
  }

  override disconnectedCallback() {
    this.root.blockViewMap.delete(this.pathName);
    super.disconnectedCallback();
  }

  override render(): unknown {
    return null;
  }
}
