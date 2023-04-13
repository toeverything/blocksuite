import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { ShadowlessElement } from '../../../__internal__/index.js';

const notFoundIcon = html`<svg
  width="25"
  height="24"
  viewBox="0 0 25 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M14.5 3H8.3C6.61984 3 5.77976 3 5.13803 3.32698C4.57354 3.6146 4.1146 4.07354 3.82698 4.63803C3.5 5.27976 3.5 6.11984 3.5 7.8V16.2C3.5 17.8802 3.5 18.7202 3.82698 19.362C4.1146 19.9265 4.57354 20.3854 5.13803 20.673C5.77976 21 6.61984 21 8.3 21H12.5L15.5 18L11.5 14L12.8418 12.6582C12.8197 12.6391 12.7979 12.6205 12.7762 12.6022C12.4696 12.3444 12.1366 12.1162 11.7278 11.987C11.1185 11.7945 10.4637 11.8016 9.85866 12.0072C9.45274 12.1452 9.12474 12.3806 8.82383 12.645C8.82383 12.645 6.60291 14.8415 5.5 15.9308V6.6C5.5 6.03995 5.5 5.75992 5.60899 5.54601C5.70487 5.35785 5.85785 5.20487 6.04601 5.10899C6.25992 5 6.53995 5 7.1 5H12.5L14.5 3ZM13.304 7.80408C13.1102 8.15931 13 8.56677 13 9C13 9.94759 13.5271 10.7719 14.3041 11.1959L15.5 10L13.304 7.80408ZM15.4156 11.4986L16.9142 10L13.9514 7.03724C14.3773 6.7008 14.9152 6.5 15.5 6.5C16.8806 6.5 18 7.61914 18 9C18 10.3809 16.8806 11.5 15.5 11.5C15.4718 11.5 15.4437 11.4995 15.4156 11.4986ZM13.5691 13.3451C13.6352 13.4103 13.7029 13.4775 13.7724 13.5464L14.7645 14.5302C15.0059 14.2937 15.2246 14.0861 15.4261 13.9167C15.7329 13.6587 16.0663 13.4302 16.4756 13.3011C17.0855 13.1087 17.7409 13.1162 18.3463 13.3226C18.7524 13.4611 19.0805 13.6971 19.3813 13.9622C19.4202 13.9965 19.4598 14.0322 19.5 14.0694V6.6C19.5 6.03995 19.5 5.75992 19.391 5.54601C19.2951 5.35785 19.1422 5.20487 18.954 5.10899C18.7401 5 18.4601 5 17.9 5H13.9143L15.9143 3H16.7C18.3802 3 19.2202 3 19.862 3.32698C20.4265 3.6146 20.8854 4.07354 21.173 4.63803C21.5 5.27976 21.5 6.11984 21.5 7.8V16.2C21.5 17.8802 21.5 18.7202 21.173 19.362C20.8854 19.9265 20.4265 20.3854 19.862 20.673C19.2202 21 18.3802 21 16.7 21H13.9143L16.9142 18L12.9142 14L13.5691 13.3451Z"
    fill="#6880FF"
  />
</svg>`;

const ELEMENT_TAG = 'affine-image-block-not-found-card' as const;

@customElement(ELEMENT_TAG)
export class AffineImageBlockNotFoundCard extends ShadowlessElement {
  static styles = css`
    .affine-image-block-not-found-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 453px;
      height: 104px;
      margin: 0 auto;
      border: 1px solid var(--affine-border-color);
      border-radius: 10px;
      background: var(--affine-background-primary-color);
    }
  `;

  render() {
    return html`
      <div class="affine-image-block-not-found-card">${notFoundIcon}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [ELEMENT_TAG]: AffineImageBlockNotFoundCard;
  }
}
