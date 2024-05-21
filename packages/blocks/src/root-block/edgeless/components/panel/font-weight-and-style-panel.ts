import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CheckIcon } from '../../../../_common/icons/edgeless.js';
import {
  CanvasTextFontFamily,
  CanvasTextFontFamilyValue,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../../../surface-block/consts.js';
import {
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
} from '../../../../surface-block/utils/font.js';

@customElement('edgeless-font-weight-and-style-panel')
export class EdgelessFontWeightAndStylePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: start;
      flex-direction: column;
      min-width: 124px;
    }

    edgeless-tool-icon-button {
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
    if (!CanvasTextFontFamilyValue.includes(this.fontFamily)) return false;

    const fontFace = getFontFaces()
      .filter(isSameFontFamily(this.fontFamily))
      .find(fontFace => {
        return fontFace.weight === fontWeight && fontFace.style === fontStyle;
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

    return html`${fontFacesWithNormal.length > 0
      ? repeat(
          fontFacesWithNormal,
          fontFace => fontFace.weight,
          fontFace => {
            const active = this._isActive(
              fontFace.weight as CanvasTextFontWeight
            );
            return html`
              <edgeless-tool-icon-button
                class=${fontFace.weight}
                .iconContainerPadding=${[4, 8]}
                .justify=${'space-between'}
                .disabled=${this._isDisabled(
                  fontFace.weight as CanvasTextFontWeight
                )}
                .active=${active}
                @click=${() =>
                  this._onSelect(fontFace.weight as CanvasTextFontWeight)}
              >
                ${fontFace.weight === CanvasTextFontWeight.Light
                  ? 'Light'
                  : fontFace.weight === CanvasTextFontWeight.Regular
                    ? 'Regular'
                    : 'Semibold'}
                ${active ? CheckIcon : nothing}
              </edgeless-tool-icon-button>
            `;
          }
        )
      : nothing}
    ${fontFacesWithItalic.length > 0
      ? html`<edgeless-menu-divider
            data-orientation="horizontal"
            style="--height: 8px"
          ></edgeless-menu-divider>

          ${repeat(
            fontFacesWithItalic,
            fontFace => fontFace.weight,
            fontFace => {
              const active = this._isActive(
                fontFace.weight as CanvasTextFontWeight,
                CanvasTextFontStyle.Italic
              );
              return html`
                <edgeless-tool-icon-button
                  class="${fontFace.weight} italic"
                  .iconContainerPadding=${[4, 8]}
                  .justify=${'space-between'}
                  .disabled=${this._isDisabled(
                    fontFace.weight as CanvasTextFontWeight,
                    CanvasTextFontStyle.Italic
                  )}
                  .active=${active}
                  @click=${() =>
                    this._onSelect(
                      fontFace.weight as CanvasTextFontWeight,
                      CanvasTextFontStyle.Italic
                    )}
                >
                  ${fontFace.weight === CanvasTextFontWeight.Light
                    ? 'Light Italic'
                    : fontFace.weight === CanvasTextFontWeight.Regular
                      ? 'Regular Italic'
                      : 'Semibold Italic'}
                  ${active ? CheckIcon : nothing}
                </edgeless-tool-icon-button>
              `;
            }
          )} `
      : nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-font-weight-and-style-panel': EdgelessFontWeightAndStylePanel;
  }
}
