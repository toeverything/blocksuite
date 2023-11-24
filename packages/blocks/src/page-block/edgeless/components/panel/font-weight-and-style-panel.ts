import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  CANVAS_TEXT_FONT_FAMILY,
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../../../surface-block/consts.js';
import { getFontFacesByFontFamily } from '../../../../surface-block/elements/text/utils.js';

@customElement('edgeless-font-weight-and-style-panel')
export class EdgelessFontWeightAndStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: start;
      justify-content: center;
      background: var(--affine-background-overlay-panel-color);
      gap: 8px;
      padding: 8px;
    }

    .container edgeless-tool-icon-button {
      width: 100%;
    }

    component-toolbar-menu-divider {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  fontFamily = CanvasTextFontFamily.Inter;
  @property({ attribute: false })
  fontWeight = CanvasTextFontWeight.Regular;
  @property({ attribute: false })
  fontStyle = CanvasTextFontStyle.Normal;

  @property({ attribute: false })
  onSelect?: (
    fontWeight: CanvasTextFontWeight,
    fontStyle: CanvasTextFontStyle
  ) => void;

  private _onSelect(
    fontWeight: CanvasTextFontWeight,
    fontStyle: CanvasTextFontStyle = CanvasTextFontStyle.Normal
  ) {
    this.fontWeight = fontWeight;
    this.fontStyle = fontStyle;
    if (this.onSelect) {
      this.onSelect(fontWeight, fontStyle);
    }
  }

  private _isDisabled(
    fontWeight: CanvasTextFontWeight,
    fontStyle: CanvasTextFontStyle = CanvasTextFontStyle.Normal
  ) {
    // Compatible with old data
    if (!CANVAS_TEXT_FONT_FAMILY.includes(this.fontFamily)) return false;

    const fonts = document.fonts;
    const fontFace = [...fonts.keys()].find(fontFace => {
      return (
        fontFace.family === this.fontFamily &&
        fontFace.weight === fontWeight &&
        fontFace.style === fontStyle
      );
    });

    return !fontFace;
  }

  private _isActive(
    fontWeight: CanvasTextFontWeight,
    fontStyle: CanvasTextFontStyle = CanvasTextFontStyle.Normal
  ) {
    return this.fontWeight === fontWeight && this.fontStyle === fontStyle;
  }

  override render() {
    let fontFaces = getFontFacesByFontFamily(this.fontFamily);
    // Compatible with old data
    if (fontFaces.length === 0) {
      fontFaces = getFontFacesByFontFamily(CanvasTextFontFamily.Inter);
    }

    const fontFacesWithNormal = fontFaces.filter(fontFace => {
      return fontFace.style === CanvasTextFontStyle.Normal;
    });
    const fontFacesWithItalic = fontFaces.filter(fontFace => {
      return fontFace.style === CanvasTextFontStyle.Italic;
    });

    return html`
      <div class="container">
        ${fontFacesWithNormal.length > 0
          ? html`${fontFacesWithNormal.map(
              fontFace => html`
                <edgeless-tool-icon-button
                  class=${fontFace.weight}
                  .disabled=${this._isDisabled(
                    fontFace.weight as CanvasTextFontWeight
                  )}
                  .active=${this._isActive(
                    fontFace.weight as CanvasTextFontWeight
                  )}
                  .activeMode=${'background'}
                  .iconContainerPadding=${2}
                  @click=${() => {
                    this._onSelect(fontFace.weight as CanvasTextFontWeight);
                  }}
                >
                  <div>
                    ${fontFace.weight === CanvasTextFontWeight.Light
                      ? 'Light'
                      : fontFace.weight === CanvasTextFontWeight.Regular
                      ? 'Regular'
                      : 'Semibold'}
                  </div>
                </edgeless-tool-icon-button>
              `
            )}`
          : nothing}
        ${fontFacesWithItalic.length > 0
          ? html`<component-toolbar-menu-divider
                .vertical=${false}
              ></component-toolbar-menu-divider>

              ${fontFacesWithItalic.map(
                fontFace => html`
                  <edgeless-tool-icon-button
                    class="${fontFace.weight} italic"
                    .disabled=${this._isDisabled(
                      fontFace.weight as CanvasTextFontWeight,
                      CanvasTextFontStyle.Italic
                    )}
                    .active=${this._isActive(
                      fontFace.weight as CanvasTextFontWeight,
                      CanvasTextFontStyle.Italic
                    )}
                    .activeMode=${'background'}
                    .iconContainerPadding=${2}
                    @click=${() => {
                      this._onSelect(
                        fontFace.weight as CanvasTextFontWeight,
                        CanvasTextFontStyle.Italic
                      );
                    }}
                  >
                    <div>
                      ${fontFace.weight === CanvasTextFontWeight.Light
                        ? 'Light Italic'
                        : fontFace.weight === CanvasTextFontWeight.Regular
                        ? 'Regular Italic'
                        : 'Semibold Italic'}
                    </div>
                  </edgeless-tool-icon-button>
                `
              )} `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-weight-and-style-panel': EdgelessFontWeightAndStylePanel;
  }
}
