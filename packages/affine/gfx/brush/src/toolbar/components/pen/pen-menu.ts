import { adjustColorAlpha } from '@blocksuite/affine-components/color-picker';
import { DefaultTheme } from '@blocksuite/affine-model';
import {
  FeatureFlagService,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import type { ColorEvent } from '@blocksuite/affine-shared/utils';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { computed, type Signal } from '@preact/signals-core';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { Pen, PenMap } from './types';

export class EdgelessPenMenu extends EdgelessToolbarToolMixin(
  SignalWatcher(LitElement)
) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      z-index: -1;
    }

    .pens {
      display: flex;
      padding: 0 4px;
      align-items: center;

      .pen-wrapper {
        display: flex;
        min-width: 38px;
        height: 64px;
        align-items: flex-end;
        justify-content: center;
        position: relative;
        transform: translateY(10px);
        transition-property: color, transform;
        transition-duration: 300ms;
        transition-timing-function: ease-in-out;
        cursor: pointer;
      }

      .pen-wrapper:hover,
      .pen-wrapper:active,
      .pen-wrapper[data-active] {
        transform: translateY(-10px);
      }
    }

    .menu-content {
      display: flex;
      align-items: center;
    }

    menu-divider {
      height: 24px;
      margin: 0 9px;
    }
  `;

  private readonly _theme$ = computed(() => {
    return this.edgeless.std.get(ThemeProvider).theme$.value;
  });

  private readonly _onPickPen = (tool: Pen) => {
    this.pen$.value = tool;
    this.setEdgelessTool(tool);
  };

  private readonly _onPickColor = (e: ColorEvent) => {
    let color = e.detail.value;
    if (this.pen$.peek() === 'highlighter') {
      color = adjustColorAlpha(color, 0.3);
    }
    this.onChange({ color });
  };

  override type: Pen[] = ['brush', 'highlighter'];

  override render() {
    const {
      _theme$: { value: theme },
      color$: { value: currentColor },
      colors$: {
        value: { brush: brushColor, highlighter: highlighterColor },
      },
      pen$: { value: pen },
      penIconMap$: {
        value: { brush: brushIcon, highlighter: highlighterIcon },
      },
    } = this;

    return html`
      <edgeless-slide-menu>
        <div class="pens" slot="prefix">
          <div
            class="pen-wrapper edgeless-brush-button"
            ?data-active="${pen === 'brush'}"
            style=${styleMap({ color: brushColor })}
            @click=${() => this._onPickPen('brush')}
          >
            ${brushIcon}
          </div>
          <div
            class="pen-wrapper edgeless-highlighter-button"
            ?data-active="${pen === 'highlighter'}"
            style=${styleMap({ color: highlighterColor })}
            @click=${() => this._onPickPen('highlighter')}
          >
            ${highlighterIcon}
          </div>
          <menu-divider .vertical=${true}></menu-divider>
        </div>
        <div class="menu-content">
          <edgeless-color-panel
            class="one-way"
            @select=${this._onPickColor}
            .value=${currentColor}
            .theme=${theme}
            .palettes=${DefaultTheme.StrokeColorShortPalettes}
            .shouldKeepColor=${true}
            .hasTransparent=${!this.edgeless.doc
              .get(FeatureFlagService)
              .getFlag('enable_color_picker')}
          ></edgeless-color-panel>
        </div>
      </edgeless-slide-menu>
    `;
  }

  @property({ attribute: false })
  accessor onChange!: (props: Record<string, unknown>) => void;

  @property({ attribute: false })
  accessor colors$!: Signal<PenMap<string>>;

  @property({ attribute: false })
  accessor color$!: Signal<string>;

  @property({ attribute: false })
  accessor pen$!: Signal<Pen>;

  @property({ attribute: false })
  accessor penIconMap$!: Signal<PenMap<TemplateResult>>;
}
