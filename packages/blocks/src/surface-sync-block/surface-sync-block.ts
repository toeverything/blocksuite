import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Disposable } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type Y } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getThemePropertyValue } from '../__internal__/theme/utils.js';
import {
  type AbstractEditor,
  Bound,
  type CssVariableName,
  deserializeXYWH,
  ElementCtors,
  isCssVariable,
  type PhasorElementType,
} from '../index.js';
import type { FrameBlockModel, SurfaceBlockModel } from '../models.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import { Renderer } from '../surface-block/renderer.js';
import type { SurfaceSyncBlockModel } from './surface-sync-model.js';
import { getSurfaceBlock } from './utils.js';

@customElement('affine-surface-sync')
export class SurfaceSyncBlockComponent extends BlockElement<SurfaceSyncBlockModel> {
  static override styles = css`
    .affine-surface-sync {
      display: flex;
      justify-content: center;
      padding: 10px;
    }

    .surface-canvas-container {
      flex-grow: 0;
      flex-shrink: 0;
    }
  `;
  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private _focused: boolean = false;

  private _referenceModel: FrameBlockModel | null = null;
  private _renderer = new Renderer();
  private _elements = new Map<string, SurfaceElement>();
  private _disposeReferenceWatcher: Disposable | null = null;

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  override connectedCallback() {
    super.connectedCallback();
    this.initSurfaceModel();
    this.initReferenceModel();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.page.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.page)
          ) {
            this.initSurfaceModel();
          }
        })
      );
    }

    this._disposables.add(() => {
      this.model.propsUpdated.on(() => {
        if (this.model.reference !== this._referenceModel?.id) {
          this.initReferenceModel();
        }
      });
    });

    const selection = this.root.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._focused = selList.some(
          sel => PathFinder.equals(sel.path, this.path) && sel.is('block')
        );
      })
    );

    this._disposables.add(() => {
      this._disposeReferenceWatcher?.dispose();
    });
  }

  override firstUpdated() {
    this.initRenderer();
  }

  initKeyBinding() {
    const addParagraph = () => {
      const parent = this.page.getParent(this.model);
      if (!parent) return;
      const index = parent.children.indexOf(this.model);
      this.page.addBlock('affine:paragraph', {}, parent, index + 1);
    };

    this.bindHotKey({
      Delete: () => {
        if (!this._focused) return;

        addParagraph();
        this.page.deleteBlock(this.model);
        return true;
      },
      Backspace: () => {
        if (!this._focused) return;

        addParagraph();
        this.page.deleteBlock(this.model);
        return true;
      },
      Enter: () => {
        if (!this._focused) return;

        addParagraph();
        return true;
      },
    });
  }

  initRenderer() {
    this._renderer.attach(this.container);

    const resizeObserver = new ResizeObserver(() => {
      this._rerender();
    });
    resizeObserver.observe(this.container);
    this._disposables.add(() => resizeObserver.disconnect());
  }

  initReferenceModel() {
    const referenceModel = this.getModel(
      this.model.reference
    ) as FrameBlockModel;

    if (!referenceModel || !referenceModel.xywh) return;

    this._referenceModel = referenceModel;
    this._disposeReferenceWatcher?.dispose();
    this._disposeReferenceWatcher = referenceModel.propsUpdated.on(() => {
      this.requestUpdate();
      this.updateComplete.then(() => {
        this._rerender();
      });
    });
  }

  initSurfaceModel() {
    this._surfaceModel = getSurfaceBlock(this.page);

    if (!this._surfaceModel) return;

    const elementsMap = this._surfaceModel.elements.getValue() as Y.Map<
      Y.Map<unknown>
    >;
    const onElementsChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
      this._onElementsChange(event, elementsMap);
    };
    elementsMap.observe(onElementsChange);
    this._disposables.add(() => elementsMap.unobserve(onElementsChange));

    this._syncFromExistingContainer(elementsMap);
  }

  private _rerender() {
    if (!this._referenceModel) {
      return;
    }

    this._renderer.onResize();
    this._renderer.setViewportByBound(
      Bound.fromXYWH(deserializeXYWH(this._referenceModel.xywh))
    );
  }

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as PhasorElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as PhasorElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: () => undefined,
      onElementUpdated: () => {},
    });
    element.computedValue = this.getCSSPropertyValue;
    element.mount(this._renderer);
    this._elements.set(element.id, element);
  }

  private _onElementsChange = (
    event: Y.YMapEvent<Y.Map<unknown>>,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    const connectors: {
      change: (typeof event)['changes']['keys'] extends Map<string, infer V>
        ? V
        : never;
      id: string;
    }[] = [];
    event.keysChanged.forEach(id => {
      const change = event.changes.keys.get(id);
      if (!change) {
        console.error('invalid event', event);
        return;
      }

      if (
        change.action === 'add' &&
        elementsMap.get(id)?.get('type') === 'connector'
      ) {
        connectors.push({ change, id });
        return;
      } else {
        this._onYEvent(change, id, elementsMap);
      }
    });
    connectors.forEach(({ change, id }) =>
      this._onYEvent(change, id, elementsMap)
    );
  };

  private _onYEvent = (
    type: Y.YMapEvent<Y.Map<unknown>>['changes']['keys'] extends Map<
      string,
      infer V
    >
      ? V
      : never,
    id: string,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    if (type.action === 'add') {
      const yElement = elementsMap.get(id) as Y.Map<unknown>;
      const type = yElement.get('type') as PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        getLocalRecord: () => undefined,
      });
      element.computedValue = this.getCSSPropertyValue;
      element.mount(this._renderer);
      this._elements.set(element.id, element);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);

      if (element) {
        element.unmount();
        this._elements.delete(id);
      }
    }

    this._renderer.refresh();
    this.requestUpdate();
  };

  private getCSSPropertyValue = (value: string) => {
    const root = this.root;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(root, value as CssVariableName);
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private getModel(id: string) {
    return this.page.getBlockById(id) ?? this._elements.get(id);
  }

  enterEdgeless() {
    if (!this._referenceModel) return;

    const xywh = deserializeXYWH(this._referenceModel.xywh);
    const doc = this.ownerDocument;
    const editorContainer = doc.querySelector(
      'editor-container'
    ) as AbstractEditor;

    if (!editorContainer) return;

    if (editorContainer.mode !== 'edgeless') {
      editorContainer.mode = 'edgeless';
    }

    setTimeout(() => {
      const edgeless = doc.querySelector('affine-edgeless-page');

      edgeless?.surface.viewport.setViewportByBound(
        Bound.fromXYWH(xywh),
        [100, 60, 100, 60],
        false
      );
    }, 50);

    this.selection.update(selections => {
      return selections.filter(sel => !PathFinder.equals(sel.path, this.path));
    });
  }

  focusBlock() {
    this.selection.update(() => {
      return [this.selection.getInstance('block', { path: this.path })];
    });
  }

  override render() {
    const { reference } = this.model;
    const model = this.getModel(reference) as FrameBlockModel;

    if (!this._surfaceModel || !model || !model.xywh) return nothing;

    const [, , w, h] = deserializeXYWH(model.xywh);

    return html`<div class="affine-surface-sync">
      <div
        class="surface-canvas-container"
        @dblclick=${this.enterEdgeless}
        @click=${this.focusBlock}
        style=${styleMap({
          maxWidth: '100%',
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
          outline: this._focused
            ? '2px solid var(--affine-primary-color)'
            : undefined,
        })}
      >
        <!-- attach canvas here -->
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-sync': SurfaceSyncBlockComponent;
  }
}
