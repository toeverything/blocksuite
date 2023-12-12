import { html } from 'lit';

import { getThemeMode } from '../../_common/utils/query.js';

export function BookmarkDefaultImage() {
  const theme = getThemeMode();
  return theme === 'light' ? lightBanner : darkBanner;
}

const lightBanner = html`<svg
  width="140"
  height="102"
  viewBox="0 0 140 102"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_2609_10955)">
    <path
      d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H136C138.209 0 140 1.79086 140 4L140.003 101.996H0.00276133L0.000108291 4Z"
      fill="#F4F4F5"
    />
    <path
      d="M15.3155 103.677L60.9139 36.6849C63.355 33.0986 68.2097 32.1115 71.8576 34.4598L179.378 103.677H15.3155Z"
      fill="#C0BFC1"
    />
    <path
      d="M-10.8186 105.203L26.4374 50.1599C28.8781 46.5539 33.7546 45.5623 37.41 47.9287L125.882 105.203H-10.8186Z"
      fill="#E3E2E4"
    />
    <ellipse
      cx="9.07407"
      cy="9.07174"
      rx="9.07407"
      ry="9.07174"
      transform="matrix(1 0 2.70729e-05 1 30.6255 11.9098)"
      fill="#C0BFC1"
    />
  </g>
  <defs>
    <clipPath id="clip0_2609_10955">
      <path
        d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H136C138.209 0 140 1.79086 140 4L140.003 101.996H0.00276133L0.000108291 4Z"
        fill="white"
      />
    </clipPath>
  </defs>
</svg> `;

const darkBanner = html`<svg
  width="140"
  height="102"
  viewBox="0 0 140 102"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g clip-path="url(#clip0_3418_93286)">
    <path
      d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H136C138.209 0 140 1.79086 140 4L140.003 101.996H0.00276133L0.000108291 4Z"
      fill="#252525"
    />
    <path
      d="M15.3152 103.677L60.9137 36.6849C63.3547 33.0986 68.2095 32.1115 71.8573 34.4598L179.378 103.677H15.3152Z"
      fill="#3E3E3F"
    />
    <path
      d="M-10.8184 105.203L26.4377 50.1599C28.8784 46.5539 33.7549 45.5623 37.4102 47.9287L125.882 105.203H-10.8184Z"
      fill="#727272"
    />
    <ellipse
      cx="9.07407"
      cy="9.07174"
      rx="9.07407"
      ry="9.07174"
      transform="matrix(1 0 2.70729e-05 1 30.6252 11.9098)"
      fill="#3E3E3F"
    />
  </g>
  <defs>
    <clipPath id="clip0_3418_93286">
      <path
        d="M0.000108291 4C4.84837e-05 1.79086 1.79086 0 4 0H136C138.209 0 140 1.79086 140 4L140.003 101.996H0.00276133L0.000108291 4Z"
        fill="white"
      />
    </clipPath>
  </defs>
</svg> `;
