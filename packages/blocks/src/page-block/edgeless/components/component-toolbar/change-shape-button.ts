import '../tool-icon-button.js';
import '../../toolbar/shape-tool/shape-menu.js';

import { WithDisposable } from '@blocksuite/blocks/std';
import type { ShapeElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { countBy, maxBy } from '../../../../__internal__/utils/std.js';
import type { ShapeMouseMode } from '../../../../__internal__/utils/types.js';
import type { EdgelessShapeMenu } from '../../toolbar/shape-tool/shape-menu.js';
import { ShapeComponentConfigMap } from '../../toolbar/shape-tool/shape-menu-config.js';
import { createButtonPopper } from '../utils.js';

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
export class EdgelessChangeShapeButton extends WithDisposable(LitElement) {
  static styles = css`
    :host {
      display: block;
      fill: none;
      stroke: currentColor;
      color: var(--affine-text-color);
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

  @state()
  private _popperShow = false;

  @query('edgeless-shape-menu')
  private _shapeMenu!: EdgelessShapeMenu;

  private _shapeMenuPopper: ReturnType<typeof createButtonPopper> | null = null;

  firstUpdated(changedProperties: Map<string, unknown>) {
    const _disposables = this._disposables;

    this._shapeMenuPopper = createButtonPopper(
      this,
      this._shapeMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    _disposables.add(this._shapeMenuPopper);
    _disposables.add(
      this._shapeMenu.slots.select.on(shapeType => {
        const updatedProps =
          shapeType === 'roundedRect'
            ? ({ shapeType: 'rect', radius: 0.1 } as const)
            : { shapeType, radius: 0 };

        this.page.captureSync();
        this.elements.forEach(element => {
          this.surface.updateElementProps(element.id, updatedProps);
        });
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
        .tooltip=${this._popperShow ? '' : 'Shape'}
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

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-shape-button': EdgelessChangeShapeButton;
  }
}
