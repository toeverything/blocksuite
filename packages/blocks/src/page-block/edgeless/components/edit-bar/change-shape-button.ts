import '../tool-icon-button.js';
import '../../toolbar/shape-tool/shape-menu.js';

import type { ShapeElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { assertExists, DisposableGroup } from '@blocksuite/store';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { ShapeMouseMode } from '../../../../__internal__/utils/types.js';
import type { EdgelessShapeMenu } from '../../toolbar/shape-tool/shape-menu.js';
import { ShapeComponentConfigMap } from '../../toolbar/shape-tool/shape-menu-config.js';
import { countBy, maxBy } from './utils.js';

const ATTR_SHOW = 'data-show';

function createShapeMenuPopper(
  reference: HTMLElement,
  popperElement: HTMLElement
) {
  const popper = createPopper(reference, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ],
  });

  const show = () => {
    popperElement.setAttribute(ATTR_SHOW, '');
    popper.setOptions(options => ({
      ...options,
      modifiers: [
        ...(options.modifiers ?? []),
        { name: 'eventListeners', enabled: false },
      ],
    }));
    popper.update();
  };

  const hide = () => {
    popperElement.removeAttribute(ATTR_SHOW);

    popper.setOptions(options => ({
      ...options,
      modifiers: [
        ...(options.modifiers ?? []),
        { name: 'eventListeners', enabled: false },
      ],
    }));
  };

  const toggle = () => {
    if (popperElement.hasAttribute(ATTR_SHOW)) {
      hide();
    } else {
      show();
    }
  };

  return {
    popper,
    show,
    hide,
    toggle,
    dispose: () => {
      popper.destroy();
    },
  };
}

function getMostCommonShape(
  elements: ShapeElement[]
): ShapeMouseMode['shape'] | undefined {
  const shapeTypes = countBy(elements, (ele: ShapeElement) => {
    return ele.shapeType === 'rect' && ele.radius
      ? 'roundedRect'
      : ele.shapeType;
  });
  const max = maxBy(Object.entries(shapeTypes), ([k, count]) => count);
  return max ? (max[0] as ShapeMouseMode['shape']) : undefined;
}

@customElement('edgeless-change-shape-button')
export class EdgelessChangeShapeButton extends LitElement {
  static styles = css`
    :host {
      display: block;
      fill: none;
      stroke: currentColor;
    }

    edgeless-shape-menu {
      display: none;
    }

    edgeless-shape-menu[data-show] {
      display: block;
    }
  `;

  @property()
  elements: ShapeElement[] = [];

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @query('edgeless-shape-menu')
  private _shapeMenu!: EdgelessShapeMenu;

  private _shapeMenuPopper: ReturnType<typeof createShapeMenuPopper> | null =
    null;

  private _disposables: DisposableGroup = new DisposableGroup();

  firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapeMenuPopper = createShapeMenuPopper(this, this._shapeMenu);
    _disposables.add(this._shapeMenuPopper);
    _disposables.add(
      this._shapeMenu.slots.select.on(shapeType => {
        const updatedProps =
          shapeType === 'roundedRect'
            ? ({ shapeType: 'rect', radius: 0.1 } as const)
            : { shapeType, radius: 0 };

        this.page.captureSync();
        this.elements.forEach(element => {
          if (element.shapeType !== shapeType) {
            this.surface.updateShapeElement(element.id, updatedProps);
          }
        });
        this.page.captureSync();
      })
    );
    super.firstUpdated(changedProperties);
  }

  render() {
    const selectedShape = getMostCommonShape(this.elements);
    const icon = selectedShape
      ? ShapeComponentConfigMap[selectedShape].icon
      : null;
    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Shape'}
        .active=${false}
        @tool.click=${() => this._shapeMenuPopper?.toggle()}
      >
        ${icon}
      </edgeless-tool-icon-button>
      <edgeless-shape-menu .selectedShape=${selectedShape}>
      </edgeless-shape-menu>
    `;
  }
}
